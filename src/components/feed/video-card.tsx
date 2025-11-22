
'use client';
import { useRef, useState } from 'react';
import type { EnrichedVideo, User, Favorite } from '@/lib/types';
import VideoPlayer from './video-player';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useDevapp } from '@/hooks/use-devapp';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase';
import ResponsiveSidebar from './ResponsiveSidebar';
import LeftUpArrow from './LeftUpArrow';
import './ResponsiveSidebar.css';
import { TipModal } from '../modals/TipModal';
import { BookModal } from '../modals/BookModal';
import { AdoptModal } from '../modals/AdoptModal';
import { sendSol } from '@/lib/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';


export function VideoCard({ video, onVote, onFavorite, guestVoteCount, onGuestVote, currentUser, nextVideo, prevVideo, voteLocked, isPlaying }: { video: EnrichedVideo, onVote: (isTop: boolean) => Promise<void>, onFavorite: (videoId:string) => Promise<void>, guestVoteCount: number, onGuestVote: () => void, currentUser: User | null, nextVideo: () => void, prevVideo: () => void, voteLocked: boolean, isPlaying: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { firestore, userWallet } = useDevapp();
  const { toast } = useToast();
  const router = useRouter();
  const wallet = useWallet();

  const [showVoteLimitModal, setShowVoteLimitModal] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const favoritesQuery = useMemoFirebase(() => {
    if (!userWallet || !firestore) return null;
    return query(collection(firestore, 'favorites'), where('userId', '==', userWallet), where('itemId', '==', video.id));
  }, [firestore, userWallet, video.id]);

  const { data: favorites } = useCollection<Favorite>(favoritesQuery);
  const isFavorited = (favorites || []).length > 0;

  const getSubRole = (user: User) => {
    if (user.talentSubcategories && user.talentSubcategories.length > 0) {
        const subcategories = typeof user.talentSubcategories === 'string' ? JSON.parse(user.talentSubcategories) : user.talentSubcategories;
        if (subcategories.length > 0) return subcategories[0];
    }
    if (user.talentCategory) {
      const cat = user.talentCategory.charAt(0).toUpperCase() + user.talentCategory.slice(1);
      if (user.role === 'artist') return cat;
    }
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }

  const handleVoteClick = (isTop: boolean) => {
    if (voteLocked) return;
    if (!userWallet) { // Guest user
      if (guestVoteCount >= 10) {
        setShowVoteLimitModal(true);
        return;
      }
      onGuestVote();
    }
    onVote(isTop);
  };
  
  const handleHireOrAdopt = () => {
    if (!currentUser || currentUser.role !== 'business') {
        setBookOpen(true);
        return;
    }
    router.push(`/profile/${video.user.walletAddress}`);
  }
  
  const handleTip = async (amount: number) => {
    if (!userWallet || !wallet.publicKey) {
      toast({ title: 'Please connect your wallet to tip artists.', variant: 'destructive' });
      return;
    }
    if (!firestore) return;
  
    setIsSubmitting(true);
    try {
      const from = wallet.publicKey;
      const to = new PublicKey(video.user.walletAddress);
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  
      const sig = await sendSol({ from, to, amountSol: amount, connection, wallet });
  
      await addDoc(collection(firestore, 'tips'), {
        txSignature: sig,
        amount: amount,
        toWallet: to.toBase58(),
        fromWallet: from.toBase58(),
        videoId: video.id,
        createdAt: serverTimestamp(),
      });
  
      toast({ title: 'Tip sent!', description: `You sent ${amount} SOL to ${video.user.username}` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Tip Failed', description: 'The transaction could not be completed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setTipOpen(false);
    }
  };
  
  const handleBook = async (payload: { date: string; time: string; budget: number; notes: string; }) => {
    if (!userWallet || !wallet.publicKey || !firestore) {
      toast({ title: 'Please connect your wallet to book artists.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { budget, ...rest } = payload;
      // In a real app, you would have an escrow program ID
      const ESCROW_PROGRAM_ID = new PublicKey("RizZUpEscrow1111111111111111111111111111111"); 
      const bookingId = crypto.randomUUID();
      const [escrowPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("rizzup-escrow"),
          wallet.publicKey.toBuffer(),
          Buffer.from(bookingId.toString()),
        ],
        ESCROW_PROGRAM_ID
      );
      
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
      const sig = await sendSol({
        from: wallet.publicKey,
        to: escrowPDA,
        amountSol: budget,
        connection,
        wallet,
      });
  
      await addDoc(collection(firestore, 'bookings'), {
        bookingId,
        artistWallet: video.user.walletAddress,
        escrowPDA: escrowPDA.toBase58(),
        userWallet: userWallet,
        amount: budget,
        ...rest,
        txSignature: sig,
        status: "escrow_pending",
        createdAt: serverTimestamp(),
      });
      
      toast({ title: 'Booking Request Sent!', description: `Your request has been sent to ${video.user.username}` });
    } catch (error) {
       console.error(error);
      toast({ title: 'Booking Failed', description: 'The transaction could not be completed.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setBookOpen(false);
    }
  };
  
  const handleAdopt = async (payload: { tier: string; amount: number; recurring: boolean; message: string; }) => {
    if (!userWallet || !wallet.publicKey || !firestore) {
      toast({ title: 'Please connect your wallet to adopt artists.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const { amount, tier, recurring } = payload;
        const from = wallet.publicKey;
        const to = new PublicKey(video.user.walletAddress);
        const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

        const sig = await sendSol({
            from,
            to,
            amountSol: amount,
            connection,
            wallet,
        });

        await addDoc(collection(firestore, 'adoptions'), {
            txSignature: sig,
            artistWallet: video.user.walletAddress,
            sponsorWallet: userWallet,
            amount,
            tier,
            recurring,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Adoption Confirmed!', description: `You are now sponsoring ${video.user.username}` });

    } catch (error) {
        console.error(error);
        toast({ title: 'Adoption Failed', description: 'The transaction could not be completed.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
        setAdoptOpen(false);
    }
  };

  const handleFavoriteClick = () => {
    if (!userWallet) {
        toast({ title: 'Please log in to save videos.', variant: 'destructive' });
        return;
    }
    onFavorite(video.id);
  }


  return (
    <div ref={cardRef} className="h-full w-full relative flex items-center justify-center bg-black">
      <TipModal
        isOpen={tipOpen}
        artistName={video.user.username}
        onClose={() => setTipOpen(false)}
        onConfirmTip={handleTip}
        isSubmitting={isSubmitting}
      />
      <BookModal
        isOpen={bookOpen}
        artistName={video.user.username}
        onClose={() => setBookOpen(false)}
        onConfirmBooking={handleBook}
        isSubmitting={isSubmitting}
      />
      <AdoptModal
        isOpen={adoptOpen}
        artistName={video.user.username}
        onClose={() => setAdoptOpen(false)}
        onConfirmAdopt={handleAdopt}
        isSubmitting={isSubmitting}
      />

        <Dialog open={showVoteLimitModal} onOpenChange={setShowVoteLimitModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vote Limit Reached</DialogTitle>
                    <DialogDescription>
                        You've used your 10 free votes as a guest. Create a free profile to continue voting on unlimited videos.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVoteLimitModal(false)}>Later</Button>
                    <Button onClick={() => router.push('/onboarding')}>Create Profile</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <VideoPlayer videoUrl={video.rawVideoInput} isActive={isPlaying} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      <div className="absolute bottom-20 left-5 right-5 text-white">
        <Link href={`/profile/${video.user.walletAddress}`} className="flex items-center gap-3 mb-3 group">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={video.user.profilePhotoUrl} alt={video.user.username} />
            <AvatarFallback>{video.user.username?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg group-hover:underline drop-shadow-lg">{video.user.username}</h3>
            <p className="text-sm font-light text-white/80 drop-shadow-lg capitalize">{getSubRole(video.user)}</p>
          </div>
        </Link>
        <p className="text-sm text-white drop-shadow-md line-clamp-2">{video.description}</p>
      </div>
      
      <LeftUpArrow onClick={prevVideo} />
      <ResponsiveSidebar
        onSave={handleFavoriteClick}
        onUp={() => handleVoteClick(true)}
        onFlop={() => handleVoteClick(false)}
        onDown={nextVideo}
        onTip={() => setTipOpen(true)}
        onBook={() => setBookOpen(true)}
        onAdopt={() => setAdoptOpen(true)}
        isFavorited={isFavorited}
      />

    </div>
  );
}
