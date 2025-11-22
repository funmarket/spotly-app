
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
import { Loader2 } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  artistName: string;
  currencyLabel?: string;
  onClose: () => void;
  onConfirmBooking: (payload: {
    date: string;
    time: string;
    budget: number;
    notes: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  artistName,
  currencyLabel = 'SOL',
  onClose,
  onConfirmBooking,
  isSubmitting = false,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    const numericBudget = Number(budget);
    if (!date || !time || !numericBudget || numericBudget <= 0) {
      alert('Please fill in date, time, and a valid budget.');
      return;
    }
    await onConfirmBooking({ date, time, budget: numericBudget, notes });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {artistName}</DialogTitle>
          <DialogDescription>Send a booking request to {artistName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Time</Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">Budget ({currencyLabel})</Label>
            <Input id="budget" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={`Your offer in ${currencyLabel}`} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Details</Label>
            <Textarea id="notes" placeholder="Describe the event, location, etc." value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
