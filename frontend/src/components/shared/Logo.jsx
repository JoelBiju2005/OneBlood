import React from 'react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const dimensions = {
    sm: { height: 32, fontSize: 'text-lg' },
    md: { height: 44, fontSize: 'text-2xl' },
    lg: { height: 68, fontSize: 'text-4xl' },
    xl: { height: 110, fontSize: 'text-6xl' }
  }[size] || { height: 44, fontSize: 'text-2xl' };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* New OneBlood Logo: Blood drop + "1" candle + flame + supporting hand */}
      <svg
        height={dimensions.height}
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_2px_12px_rgba(185,28,28,0.5)]"
      >
        <defs>
          <radialGradient id="dropGrad" cx="50%" cy="40%" r="60%" fx="50%" fy="30%">
            <stop offset="0%" stopColor="#EF1C25" />
            <stop offset="100%" stopColor="#8B0000" />
          </radialGradient>
          <radialGradient id="flameGrad" cx="50%" cy="70%" r="60%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#CC0000" />
          </radialGradient>
        </defs>

        {/* Blood drop outer shape */}
        <path
          d="M100 8 C60 55 38 100 38 138 C38 180 66 212 100 212 C134 212 162 180 162 138 C162 100 140 55 100 8 Z"
          fill="url(#dropGrad)"
        />

        {/* Supporting hand — white negative-space curved stroke at the bottom */}
        <path
          d="M58 168 Q68 155 80 162 Q90 168 100 162 Q110 155 120 162 Q132 168 142 160"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* "1" body — white negative space */}
        <rect x="90" y="100" width="20" height="60" rx="3" fill="white" />
        {/* "1" top serif / angled stroke */}
        <path d="M78 115 L90 100" stroke="white" strokeWidth="8" strokeLinecap="round" />

        {/* Flame */}
        <path
          d="M100 99 C96 90 88 82 92 72 C94 66 98 62 100 56 C102 62 106 66 108 72 C112 82 104 90 100 99 Z"
          fill="url(#flameGrad)"
        />
        {/* Inner flame highlight */}
        <path
          d="M100 94 C98 88 94 83 96 76 C97 72 99 70 100 66 C101 70 103 72 104 76 C106 83 102 88 100 94 Z"
          fill="white"
          opacity="0.55"
        />
      </svg>

      {/* Brand text: OneBlood */}
      {showText && (
        <span className={`${dimensions.fontSize} font-heading tracking-wide flex items-center`}>
          <span className="font-extrabold text-oneblood-crimson">One</span>
          <span className="font-bold text-white">Blood</span>
        </span>
      )}
    </div>
  );
}
