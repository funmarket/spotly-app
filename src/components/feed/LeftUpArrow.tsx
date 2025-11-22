import React from "react";
import "./ResponsiveSidebar.css";

export default function LeftUpArrow({ onClick }: { onClick: () => void }) {
  return (
    <button className="rzu-left-btn" onClick={onClick}>
      <svg className="rzu-icon green" viewBox="0 0 24 24">
        <path d="M12 4l6 8h-4v8h-4v-8H6z" />
      </svg>
    </button>
  );
}
