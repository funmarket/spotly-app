
'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface TipModalProps {
  isOpen: boolean;
  artistName: string;
  presets?: number[];
  currencyLabel?: string;
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
    const amount = selectedAmount ?? (customAmount ? Number(customAmount) : NaN);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please select or enter a valid amount.');
      return;
    }
    await onConfirmTip(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tip {artistName}</DialogTitle>
          <DialogDescription>Support {artistName} with a tip!</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <Button
                key={p}
                variant={selectedAmount === p ? 'default' : 'secondary'}
                onClick={() => {
                  setSelectedAmount(p);
                  setCustomAmount('');
                }}
              >
                {p} {currencyLabel}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min="0"
            step="0.0001"
            placeholder={`Or enter a custom amount in ${currencyLabel}`}
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            className="text-center"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Send Tip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
