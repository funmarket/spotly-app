
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

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
    await onConfirmAdopt({ tier, amount: numericAmount, recurring, message });
  };
  
  const TIER_COLORS = {
      bronze: 'bg-[#cd7f32] hover:bg-[#cd7f32]/90 border-[#cd7f32]',
      silver: 'bg-[#c0c0c0] hover:bg-[#c0c0c0]/90 border-[#c0c0c0] text-black',
      gold: 'bg-[#ffd700] hover:bg-[#ffd700]/90 border-[#ffd700] text-black',
  }
  const TIER_COLORS_INACTIVE = {
      bronze: 'border-[#cd7f32] text-[#cd7f32]',
      silver: 'border-[#c0c0c0] text-[#c0c0c0]',
      gold: 'border-[#ffd700] text-[#ffd700]',
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adopt {artistName}</DialogTitle>
          <DialogDescription>Become a sponsor for {artistName}!</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={tier === 'bronze' ? 'default' : 'outline'}
              className={tier === 'bronze' ? TIER_COLORS.bronze : TIER_COLORS_INACTIVE.bronze}
              onClick={() => setTier('bronze')}
            >
              Bronze
            </Button>
            <Button
              variant={tier === 'silver' ? 'default' : 'outline'}
              className={tier === 'silver' ? TIER_COLORS.silver : TIERCOLORS_INACTIVE.silver}
              onClick={() => setTier('silver')}
            >
              Silver
            </Button>
            <Button
              variant={tier === 'gold' ? 'default' : 'outline'}
              className={tier === 'gold' ? TIER_COLORS.gold : TIER_COLORS_INACTIVE.gold}
              onClick={() => setTier('gold')}
            >
              Gold
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currencyLabel})</Label>
            <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Sponsorship amount in ${currencyLabel}`} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="recurring" checked={recurring} onCheckedChange={(checked) => setRecurring(!!checked)} />
            <Label htmlFor="recurring">Monthly recurring support</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea id="message" placeholder="Say hi, share why you want to support them..." value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Confirm Adoption
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
