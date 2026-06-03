import React from 'react';
import logoImg from '../../assets/oneblood-logo.png';

export default function Logo({ size = 'md', showText = false, className = '', width, height }) {
  const dimensions = {
    sm: { h: 32 },
    md: { h: 44 },
    lg: { h: 68 },
    xl: { h: 110 }
  }[size] || { h: 44 };

  // If explicit width/height props are passed, use those (Layout passes these)
  const imgHeight = height || dimensions.h;
  // The logo image is roughly square (with text below), so let width auto-fit
  const imgStyle = {
    height: `${imgHeight}px`,
    width: width ? `${width}px` : 'auto',
    objectFit: 'contain'
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="OneBlood — One Need. One Response. One Life."
        style={imgStyle}
        className="drop-shadow-[0_2px_12px_rgba(185,28,28,0.4)]"
        draggable={false}
      />
    </div>
  );
}
