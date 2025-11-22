import React from 'react';
import { ThumbsDown, Heart, DollarSign, Book, User } from 'lucide-react';
import './ResponsiveSidebar.css';

type SidebarProps = {
  onSave?: () => void;
  onUp?: () => void;
  onFlop?: () => void;
  onDown?: () => void;
  onTip?: () => void;
  onBook?: () => void;
  onAdopt?: () => void;
  isFavorited?: boolean;
};

export default function ResponsiveSidebar({
  onSave,
  onUp,
  onFlop,
  onDown,
  onTip,
  onBook,
  onAdopt,
  isFavorited,
}: SidebarProps) {
  return (
    <div className="rzu-sidebar">

      {/* SAVE */}
      <div className="rzu-btn" onClick={onSave}>
        <Heart className={`rzu-icon ${isFavorited ? 'text-red-400 fill-current' : 'text-white'}`} />
        <span className="rzu-label">Save</span>
      </div>

      {/* TOP – GREEN FINGER 👍 */}
      <div className="rzu-btn" onClick={onUp}>
        <svg className="rzu-icon" fill="#00ff66" viewBox="0 0 24 24">
          <path d="M2 21h4V9H2v12zM15 21h-5c-1.1 0-2-.9-2-2v-8l5-6c.8-.9 2.3-.3 2.3.9v4h3.6c1 0 1.7.9 1.5 1.9l-1.7 8c-.2.9-1 1.5-2 1.5h-1.7z"/>
        </svg>
        <span className="rzu-label">Top</span>
      </div>

      {/* FLOP – RED THUMBS DOWN */}
      <div className="rzu-btn" onClick={onFlop}>
        <ThumbsDown className="rzu-icon text-red-400" />
        <span className="rzu-label">Flop</span>
      </div>

      {/* DOWN – WHITE ARROW */}
      <div className="rzu-btn" onClick={onDown}>
        <svg className="rzu-arrow" viewBox="0 0 24 24" fill="none">
          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="rzu-label">Down</span>
      </div>

      {/* TIP */}
      <div className="rzu-btn" onClick={onTip}>
        <DollarSign className="rzu-icon text-yellow-400" />
        <span className="rzu-label">Tip</span>
      </div>

      {/* BOOK */}
      <div className="rzu-btn" onClick={onBook}>
        <Book className="rzu-icon text-cyan-400" />
        <span className="rzu-label">Book</span>
      </div>

      {/* ADOPT */}
      <div className="rzu-btn" onClick={onAdopt}>
        <User className="rzu-icon text-purple-400" />
        <span className="rzu-label">Adopt</span>
      </div>

    </div>
  );
}
