import React from 'react';
import './ResponsiveSidebar.css';


const UpArrow = ({ size = 22, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 19V5M5 12l7-7 7 7"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

export default function LeftUpArrow({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <button onClick={onClick} className="slick-button sidebar-button">
            <UpArrow size={18}/>
        </button>
    </div>
  );
}
