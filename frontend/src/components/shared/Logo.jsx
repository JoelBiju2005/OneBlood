import React from 'react';
import logoImg from '../../assets/oneblood-logo.png';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const heights = {
    sm: 28,
    md: 36,
    lg: 52,
    xl: 80
  };

  const imgHeight = heights[size] || heights.md;

  return (
    <div className={`flex items-center space-x-2 select-none ${className}`}>
      <img
        src={logoImg}
        alt="OneBlood"
        style={{ height: `${imgHeight}px`, width: 'auto', objectFit: 'contain' }}
        className="drop-shadow-[0_2px_8px_rgba(185,28,28,0.3)]"
        draggable={false}
      />
      {showText && (
        <span
          className="font-display tracking-tight flex items-center"
          style={{ fontSize: `${imgHeight * 0.55}px`, lineHeight: 1 }}
        >
          <span className="text-ob-red-700">One</span>
          <span className="text-ob-black dark:text-ob-white">Blood</span>
        </span>
      )}
    </div>
  );
}
