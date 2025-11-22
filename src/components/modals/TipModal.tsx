
import React, { useState } from 'react';
import { BaseModal } from '../ui/BaseModal';

interface TipModalProps {
  isOpen: boolean;
  artistName: string;
  presets?: number[]; // e.g. [0.001, 0.01, 0.1]
  currencyLabel?: string; // "SOL", "USD", etc.
  onClose: () => void;
  onConfirmTip: (amount: number) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  artistName,
  presets = [0.001, 0.01, 0.1],
  currencyLabel = 'SOL',
  onClose,
  onConfirmTip,
  isSubmitting = false,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const handleConfirm = async () => {
    const amount =
      selectedAmount ?? (customAmount ? Number(customAmount) : NaN);

    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please select or enter a valid amount.');
      return;
    }

    await onConfirmTip(amount);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title={`Tip ${artistName}`}
      onClose={isSubmitting ? () => {} : onClose}
    >
      <p className="modal-subtitle">Support {artistName} with a tip!</p>

      <div className="tip-preset-row">
        {presets.map((p) => (
          <button
            key={p}
            className={`tip-preset ${
              selectedAmount === p ? 'tip-preset--active' : ''
            }`}
            onClick={() => {
              setSelectedAmount(p);
              setCustomAmount('');
            }}
          >
            {p} {currencyLabel}
          </button>
        ))}
      </div>

      <div className="tip-custom-input">
        <input
          type="number"
          min="0"
          step="0.0001"
          placeholder={`Custom amount in ${currencyLabel}`}
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          className="w-full p-2 text-center border rounded"
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Tip'}
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
