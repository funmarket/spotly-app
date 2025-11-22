
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------- Solana helpers ----------

function getConnection() {
  const url =
    functions.config().solana?.rpc_url ||
    "https://api.mainnet-beta.solana.com";
  return new Connection(url, "confirmed");
}

function getEscrowKeypair() {
  const secret = functions.config().solana?.escrow_secret;
  if (!secret) {
    throw new Error("Missing solana.escrow_secret in functions config");
  }

  let secretKey;
  if (secret.trim().startsWith("[")) {
    secretKey = Uint8Array.from(JSON.parse(secret));
  } else {
    const bs58 = require("bs58");
    secretKey = bs58.decode(secret);
  }
  return Keypair.fromSecretKey(secretKey);
}

async function sendSol(fromKp, toPubkeyStr, amountSol) {
  const connection = getConnection();
  const toPubkey = new PublicKey(toPubkeyStr);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKp.publicKey,
      toPubkey,
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [fromKp], {
    skipPreflight: false,
    commitment: "confirmed",
  });

  return sig;
}

function splitAmountWithFee(amountSol) {
  const bps = parseInt(functions.config().solana?.platform_fee_bps || "0", 10);
  if (!bps) return { artistAmount: amountSol, platformAmount: 0 };

  const fee = (amountSol * bps) / 10000;
  const artistAmount = amountSol - fee;
  return { artistAmount, platformAmount: fee };
}

function https(fn) {
  return functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).send("POST only");
        }
        const result = await fn(req, res);
        if (!res.headersSent) {
          res.json(result || { ok: true });
        }
      } catch (err) {
        console.error("Function error:", err);
        if (!res.headersSent) {
          res.status(500).send(err.message || "Internal error");
        }
      }
    });
  });
}

// ====================================================================
// Functions for creating and confirming transactions
// ====================================================================

const createTransactionHandler = (collectionName, requiredBodyFields) => https(async (req, res) => {
    const { fromWallet, toWallet, amountSol, videoId, ...otherDetails } = req.body || {};
    
    for (const field of requiredBodyFields) {
        if (!req.body[field]) {
            res.status(400).json({ error: `${field} is required`});
            return;
        }
    }

    const fromPubkey = new PublicKey(fromWallet);
    const toPubkey = new PublicKey(toWallet);
    const amountLamports = Math.floor(Number(amountSol) * LAMPORTS_PER_SOL);
    
    if (amountLamports <= 0) {
        res.status(400).json({ error: "amountSol must be > 0" });
        return;
    }

    const docRef = await db.collection(collectionName).add({
        fromWallet,
        toWallet,
        videoId: videoId || null,
        amountLamports,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...otherDetails
    });

    const { blockhash, lastValidBlockHeight } = await getConnection().getLatestBlockhash("finalized");

    const tx = new Transaction({
        recentBlockhash: blockhash,
        lastValidBlockHeight,
        feePayer: fromPubkey,
    }).add(
        SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: amountLamports,
        })
    );

    const txSerialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

    res.json({
        [`${collectionName.slice(0, -1)}Id`]: docRef.id,
        txBase64: txSerialized.toString("base64"),
    });
});

const confirmTransactionHandler = (collectionName) => https(async (req, res) => {
    const { [`${collectionName.slice(0, -1)}Id`]: docId, txSignature } = req.body || {};
    if (!docId || !txSignature) {
        res.status(400).json({ error: `docId and txSignature are required` });
        return;
    }

    try {
        const conf = await getConnection().getSignatureStatus(txSignature);
        if (!conf || !conf.value || conf.value.err) {
            res.status(400).json({ error: "Transaction not confirmed on-chain" });
            return;
        }
    } catch (e) {
        console.warn("Could not verify signature, storing anyway:", e);
    }

    await db.collection(collectionName).doc(docId).update({
        status: "completed",
        txSignature,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ ok: true });
});

exports.createTipTransaction = createTransactionHandler('tips', ['fromWallet', 'toWallet', 'amountSol']);
exports.confirmTip = confirmTransactionHandler('tips');

exports.createBookingEscrowTransaction = createTransactionHandler('bookings', ['fromWallet', 'toWallet', 'amountSol', 'date', 'time']);
exports.confirmBookingEscrow = confirmTransactionHandler('bookings');

exports.createAdoptionEscrowTransaction = createTransactionHandler('adoptions', ['fromWallet', 'toWallet', 'amountSol', 'tier']);
exports.confirmAdoptionEscrow = confirmTransactionHandler('adoptions');


// ====================================================================
// Escrow release and refund functions
// ====================================================================

const releaseEscrow = https(async (req) => {
  const { bookingId } = req.body || {};
  if (!bookingId) throw new Error("bookingId required");

  const snap = await db.collection("bookings").doc(bookingId).get();
  if (!snap.exists) throw new Error("Booking not found");

  const booking = snap.data();
  if (booking.status !== "escrow_pending") {
    throw new Error("Booking is not in escrow_pending state");
  }

  const escrowKp = getEscrowKeypair();
  const { artistAmount } = splitAmountWithFee(booking.amountSol);

  const sig = await sendSol(escrowKp, booking.artistWallet, artistAmount);

  await snap.ref.update({
    status: "released",
    releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    releaseTxids: [sig],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, txids: [sig] };
});

const refundEscrow = https(async (req) => {
  const { bookingId } = req.body || {};
  if (!bookingId) throw new Error("bookingId required");

  const snap = await db.collection("bookings").doc(bookingId).get();
  if (!snap.exists) throw new Error("Booking not found");

  const booking = snap.data();
  if (booking.status !== "escrow_pending") {
    throw new Error("Booking is not in escrow_pending state");
  }

  const escrowKp = getEscrowKeypair();
  const sig = await sendSol(escrowKp, booking.businessWallet, booking.amountSol);

  await snap.ref.update({
    status: "refunded",
    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
    refundTxid: sig,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, txid: sig };
});

exports.releaseBookingEscrow = releaseEscrow;
exports.refundBookingEscrow = refundEscrow;

const releaseAdoption = https(async(req) => {
    const { adoptionId } = req.body || {};
    if (!adoptionId) throw new Error("adoptionId is required");
    
    const snap = await db.collection("adoptions").doc(adoptionId).get();
    if (!snap.exists) throw new Error("Adoption not found");

    const adoption = snap.data();
    if(adoption.status !== 'escrow_pending') throw new Error("Adoption is not in escrow_pending state");

    const escrowKp = getEscrowKeypair();
    const { artistAmount } = splitAmountWithFee(adoption.amountSol);

    const sig = await sendSol(escrowKp, adoption.artistWallet, artistAmount);

    await snap.ref.update({
        status: "released",
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        releaseTxids: [sig],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, txids: [sig] };
});

const refundAdoption = https(async(req) => {
    const { adoptionId } = req.body || {};
    if (!adoptionId) throw new Error("adoptionId is required");

    const snap = await db.collection("adoptions").doc(adoptionId).get();
    if (!snap.exists) throw new Error("Adoption not found");
    
    const adoption = snap.data();
    if(adoption.status !== 'escrow_pending') throw new Error("Adoption is not in escrow_pending state");

    const escrowKp = getEscrowKeypair();
    const sig = await sendSol(escrowKp, adoption.businessWallet, adoption.amountSol);

    await snap.ref.update({
        status: "refunded",
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundTxid: sig,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, txid: sig };
});

exports.releaseAdoptionEscrow = releaseAdoption;
exports.refundAdoptionEscrow = refundAdoption;

// ====================================================================
// Scheduled timeout release
// ====================================================================

exports.autoReleaseTimedOutEscrows = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const bookingsSnap = await db
      .collection("bookings")
      .where("status", "==", "escrow_pending")
      .where("expiresAt", "<=", now)
      .get();

    for (const doc of bookingsSnap.docs) {
      try {
        await releaseEscrow({ body: { bookingId: doc.id, adminOverride: true } }, { end: () => {} });
      } catch (e) {
        console.error("autoRelease booking failed:", doc.id, e);
      }
    }

    const adoptionsSnap = await db
      .collection("adoptions")
      .where("status", "==", "escrow_pending")
      .where("expiresAt", "<=", now)
      .get();

    for (const doc of adoptionsSnap.docs) {
      try {
        await releaseAdoption({ body: { adoptionId: doc.id, adminOverride: true } }, { end: () => {} });
      } catch (e) {
        console.error("autoRelease adoption failed:", doc.id, e);
      }
    }

    return null;
  });
