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
      <button className="rzu-btn" onClick={onSave}>
        <svg className="rzu-icon yellow" viewBox="0 0 24 24">
          <path d="M6 4h12v17l-6-4-6 4V4z" />
        </svg>
        <span className="rzu-label">Save</span>
      </button>

      <button className="rzu-btn" onClick={onUp}>
        <svg className="rzu-icon green" viewBox="0 0 24 24">
          <path d="M12 4l6 8h-4v8h-4v-8H6z" />
        </svg>
        <span className="rzu-label">Top</span>
      </button>

      <button className="rzu-btn" onClick={onFlop}>
        <svg className="rzu-icon red" viewBox="0 0 24 24">
          <path d="M12 20l-6-8h4V4h4v8h4z" />
        </svg>
        <span className="rzu-label">Flop</span>
      </button>

      <button className="rzu-btn" onClick={onDown}>
        <svg className="rzu-icon green" viewBox="0 0 24 24">
          <path d="M12 20l-6-8h4V4h4v8h4z" />
        </svg>
        <span className="rzu-label">Down</span>
      </button>

      <button className="rzu-btn" onClick={onTip}>
        <svg className="rzu-icon green" viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor">
          <path d="M12 2v20M6 6h8a4 4 0 010 8H6m6 0h6" />
        </svg>
        <span className="rzu-label">Tip</span>
      </button>

      <button className="rzu-btn" onClick={onBook}>
        <svg className="rzu-icon blue" viewBox="0 0 24 24">
          <path d="M4 4h16v16H4z M4 8h16" />
        </svg>
        <span className="rzu-label">Book</span>
      </button>

      <button className="rzu-btn" onClick={onAdopt}>
        <svg className="rzu-icon purple" viewBox="0 0 24 24">
          <circle cx="12" cy="7" r="3" />
          <path d="M6 20v-2a6 6 0 1112 0v2" />
        </svg>
        <span className="rzu-label">Adopt</span>
      </button>
    </div>
  );
}
