
import React, { useState } from 'react';
import { BaseModal } from '../ui/BaseModal';

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

    await onConfirmBooking({
      date,
      time,
      budget: numericBudget,
      notes,
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Book Artist"
      onClose={isSubmitting ? () => {} : onClose}
    >
      <p className="modal-subtitle">
        Send a booking request to <strong>{artistName}</strong>
      </p>

      <div className="form-row">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Budget ({currencyLabel})</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder={`Your offer in ${currencyLabel}`}
        />
      </div>

      <div className="form-row">
        <label>Details / Notes</label>
        <textarea
          rows={3}
          placeholder="Describe the event, location, duration, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Booking Request'}
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
