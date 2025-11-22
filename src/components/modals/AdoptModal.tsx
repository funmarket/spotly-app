
import React, { useState } from 'react';
import { BaseModal } from '../ui/BaseModal';

interface AdoptModalProps {
  isOpen: boolean;
  artistName: string;
  currencyLabel?: string;
  onClose: () => void;
  onConfirmAdopt: (payload: {
    tier: 'bronze' | 'silver' | 'gold';
    amount: number;
    recurring: boolean;
    message: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const AdoptModal: React.FC<AdoptModalProps> = ({
  isOpen,
  artistName,
  currencyLabel = 'SOL',
  onClose,
  onConfirmAdopt,
  isSubmitting = false,
}) => {
  const [tier, setTier] = useState<'bronze' | 'silver' | 'gold'>('bronze');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid sponsorship amount.');
      return;
    }

    await onConfirmAdopt({
      tier,
      amount: numericAmount,
      recurring,
      message,
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Adopt Artist"
      onClose={isSubmitting ? () => {} : onClose}
    >
      <p className="modal-subtitle">
        Become a sponsor for <strong>{artistName}</strong>
      </p>

      <div className="tier-row">
        <button
          className={`tier-btn ${tier === 'bronze' ? 'tier-btn--active' : ''}`}
          onClick={() => setTier('bronze')}
        >
          Bronze
        </button>
        <button
          className={`tier-btn ${tier === 'silver' ? 'tier-btn--active' : ''}`}
          onClick={() => setTier('silver')}
        >
          Silver
        </button>
        <button
          className={`tier-btn ${tier === 'gold' ? 'tier-btn--active' : ''}`}
          onClick={() => setTier('gold')}
        >
          Gold
        </button>
      </div>

      <div className="form-row">
        <label>Amount ({currencyLabel})</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Sponsorship amount in ${currencyLabel}`}
        />
      </div>

      <div className="form-row checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Monthly recurring support
        </label>
      </div>

      <div className="form-row">
        <label>Message to artist (optional)</label>
        <textarea
          rows={3}
          placeholder="Say hi, share why you want to support them..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-primary adopt-btn"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Adoption'}
        </button>
        <button
          className="btn-secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  );
};
