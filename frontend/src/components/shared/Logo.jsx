import React from 'react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const dimensions = {
    sm: { height: 28, fontSize: 'text-lg' },
    md: { height: 40, fontSize: 'text-2xl' },
    lg: { height: 60, fontSize: 'text-4xl' },
    xl: { height: 100, fontSize: 'text-6xl' }
  }[size] || { height: 40, fontSize: 'text-2xl' };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Droplet Icon */}
      <svg
        height={dimensions.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_2px_8px_rgba(185,28,28,0.4)]"
      >
        {/* Two Arcs forming a Droplet */}
        <path
          d="M 50,5 C 20,40 15,80 50,95 C 85,80 80,40 50,5 Z"
          fill="url(#dropletGradient)"
        />
        
        {/* Embedded White Medical Cross */}
        <path
          d="M 45,55 H 55 M 50,50 V 60"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Pulse / Heartbeat Line cutting through horizontally */}
        <path
          d="M 5,60 H 32 L 38,40 L 44,80 L 50,50 L 56,70 L 62,60 H 95"
          stroke="#F59E0B" /* Accent Gold */
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="dropletGradient" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DC2626" /> {/* Crimson Light */}
            <stop offset="1" stopColor="#7F1D1D" /> {/* Crimson Dark */}
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Text */}
      {showText && (
        <span className={`${dimensions.fontSize} font-heading tracking-wide flex items-center`}>
          <span className="font-extrabold text-oneblood-crimson">ONE</span>
          <span className="font-normal text-white ml-0.5">BLOOD</span>
        </span>
      )}
    </div>
  );
}
