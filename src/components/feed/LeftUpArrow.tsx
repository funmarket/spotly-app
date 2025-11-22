import React from 'react';
import './ResponsiveSidebar.css';

export default function LeftUpArrow({ onClick }: { onClick: () => void }) {
  return (
    <button className="rzu-left-btn" onClick={onClick}>
      <svg
        className="rzu-icon"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5m-7 7l7-7 7 7"></path>
      </svg>
      <span className="rzu-label">Up</span>
    </button>
  );
}
