import React from 'react';
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

const TopIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path d="M7 22h2V10H7v12zM14 2l-4 6v14h10c.8 0 1.5-.5 1.8-1.2l2-7c.1-.4.2-.7.2-1 0-1.1-.9-2-2-2h-6l1-5c0-.3 0-.6-.1-.9-.2-.7-.8-1.1-1.4-1.1H14z"
      fill="#00ff66"/>
  </svg>
);

const FlopIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path d="M17 2h-2v12h2V2zM10 22l4-6V2H4C3.2 2 2.5 2.5 2.2 3.2l-2 7c-.1.4-.2.7-.2 1 0 1.1.9 2 2 2h6l-1 5c0 .3 0 .6.1.9.2.7.8 1.1 1.4 1.1H10z"
      fill="#ff4444"/>
  </svg>
);

const SaveIcon = ({ size = 22, className = "", isFavorited = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path d="M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2z"
      fill={isFavorited ? '#ff4444' : 'white'}/>
  </svg>
);

const DownArrow = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path d="M12 5v14M5 12l7 7 7-7"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


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
    <div className="sidebar-wrapper">
      <div className="rzu-sidebar">
        <button className="sidebar-button rzu-btn rzu-save" onClick={onSave}>
          <SaveIcon size={22} isFavorited={isFavorited} />
          <span className="rzu-label">Save</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-up" onClick={onUp}>
          <TopIcon size={22} />
          <span className="rzu-label">Top</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-flop" onClick={onFlop}>
          <FlopIcon size={22} />
          <span className="rzu-label">Flop</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-down" onClick={onDown}>
          <DownArrow size={22} />
          <span className="rzu-label">Down</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-tip" onClick={onTip}>
          <svg
            className="rzu-icon"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span className="rzu-label">Tip</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-book" onClick={onBook}>
          <svg
            className="rzu-icon"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            <rect x="2" y="6" width="20" height="14" rx="2" ry="2"></rect>
          </svg>
          <span className="rzu-label">Book</span>
        </button>

        <button className="sidebar-button rzu-btn rzu-adopt" onClick={onAdopt}>
          <svg
            className="rzu-icon"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="17" y1="11" x2="23" y2="11"></line>
          </svg>
          <span className="rzu-label">Adopt</span>
        </button>
      </div>
    </div>
  );
}
