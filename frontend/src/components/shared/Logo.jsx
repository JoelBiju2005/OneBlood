import React, { useState, useEffect } from 'react';
import logoImg from '../../assets/oneblood-logo.png';

export default function Logo({ size = 'md', showText = true, className = '', width, height }) {
  const [processedSrc, setProcessedSrc] = useState(logoImg);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoImg;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Flood fill from edges to remove white borders.
      // We will perform a BFS starting from all boundary pixels.
      const visited = new Uint8Array(w * h);
      const queue = [];

      const getPixelIdx = (x, y) => (y * w + x) * 4;

      // Add edge pixels to queue
      for (let x = 0; x < w; x++) {
        // Top edge
        queue.push(x, 0);
        visited[0 * w + x] = 1;
        // Bottom edge
        queue.push(x, h - 1);
        visited[(h - 1) * w + x] = 1;
      }
      for (let y = 1; y < h - 1; y++) {
        // Left edge
        queue.push(0, y);
        visited[y * w + 0] = 1;
        // Right edge
        queue.push(w - 1, y);
        visited[y * w + (w - 1)] = 1;
      }

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];

        const idx = getPixelIdx(cx, cy);
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // We consider a pixel as "border/background" if it's transparent, near-transparent,
        // or white/near-white (which is the border).
        // Since we start from the outside, we will only hit the outer white border.
        const isTransparentOrWhite = a < 20 || (r > 200 && g > 200 && b > 200);

        if (isTransparentOrWhite) {
          // Set to fully transparent
          data[idx + 3] = 0;

          // Push neighbors
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (!visited[nIdx]) {
                visited[nIdx] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedSrc(canvas.toDataURL());
    };
  }, []);

  const dimensions = {
    sm: { h: 32 },
    md: { h: 44 },
    lg: { h: 68 },
    xl: { h: 110 }
  }[size] || { h: 44 };

  const imgHeight = height || dimensions.h;
  const imgStyle = {
    height: `${imgHeight}px`,
    width: 'auto',
    objectFit: 'contain'
  };

  return (
    <div className={`flex items-center space-x-2 select-none ${className}`}>
      <img
        src={processedSrc}
        alt="OneBlood — One Need. One Response. One Life."
        style={imgStyle}
        className="drop-shadow-[0_2px_12px_rgba(185,28,28,0.4)]"
        draggable={false}
      />
      {showText && (
        <span 
          style={{ 
            fontFamily: 'Georgia, serif', 
            fontWeight: 'bold', 
            fontSize: `${imgHeight * 0.7}px`, 
            lineHeight: 1,
            letterSpacing: '-0.03em'
          }}
          className="flex items-center select-none"
        >
          <span style={{ color: '#C0152A' }}>One</span>
          <span className="text-white">Blood</span>
        </span>
      )}
    </div>
  );
}
