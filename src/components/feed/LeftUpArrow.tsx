import React from 'react';
import './ResponsiveSidebar.css';

export default function LeftUpArrow({ onClick }: { onClick: () => void }) {
  return (
    <div className="rzu-left-up" onClick={onClick}>
        <svg className="rzu-arrow" viewBox="0 0 24 24" fill="none">
            <path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="rzu-label">Up</span>
    </div>
  );
}
