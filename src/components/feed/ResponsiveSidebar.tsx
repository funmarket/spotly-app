import React from "react";
import "./ResponsiveSidebar.css";

type SidebarProps = {
  onSave?: () => void;
  onUp?: () => void;
  onFlop?: () => void;
  onDown?: () => void;
  onTip?: () => void;
  onBook?: () => void;
  onAdopt?: () => void;
};

export default function ResponsiveSidebar({
  onSave,
  onUp,
  onFlop,
  onDown,
  onTip,
  onBook,
  onAdopt,
}: SidebarProps) {
  return (
    <div className="rzu-sidebar">
      <button className="rzu-btn rzu-save" onClick={onSave}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="rzu-label">Save</span>
      </button>

      <button className="rzu-btn rzu-up" onClick={onUp}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M7 11h10v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9z"></path>
        </svg>
        <span className="rzu-label">Up</span>
      </button>

      <button className="rzu-btn rzu-flop" onClick={onFlop}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
           <path d="M7 13v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4M7 13H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3"></path>
        </svg>
        <span className="rzu-label">Flop</span>
      </button>

      <button className="rzu-btn rzu-down" onClick={onDown}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14m-7-7h14"></path>
        </svg>
        <span className="rzu-label">Down</span>
      </button>

      <button className="rzu-btn rzu-tip" onClick={onTip}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <span className="rzu-label">Tip</span>
      </button>

      <button className="rzu-btn rzu-book" onClick={onBook}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          <rect x="2" y="6" width="20" height="14" rx="2" ry="2"></rect>
        </svg>
        <span className="rzu-label">Book</span>
      </button>

      <button className="rzu-btn rzu-adopt" onClick={onAdopt}>
        <svg className="rzu-icon" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="17" y1="11" x2="23" y2="11"></line>
        </svg>
        <span className="rzu-label">Adopt</span>
      </button>
    </div>
  );
}
