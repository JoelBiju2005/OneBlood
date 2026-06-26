// Reusable Framer Motion animation variants
// Default easing: [0.22, 1, 0.36, 1] — Apple's ease-out-expo curve

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export const slideInRight = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export const slideInLeft = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export const staggerContainerSlow = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
};

export const cardHover = {
  rest:  { scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  hover: { scale: 1.015, y: -3, transition: { duration: 0.2, ease: 'easeOut' } }
};

// Page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }
};

// Massive scroll-reveal for How It Works timeline
export const massiveRevealLeft = {
  hidden:  { opacity: 0, x: -80, scale: 0.95 },
  visible: { 
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export const massiveRevealRight = {
  hidden:  { opacity: 0, x: 80, scale: 0.95 },
  visible: { 
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export const revealFromBelow = {
  hidden:  { opacity: 0, y: 60, scale: 0.96 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

export const revealScale = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { 
    opacity: 1, scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export const fadeUpSlow = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

export const staggerGrid = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
};

// Spotlight hover effect handler for cards
export const handleSpotlightMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  e.currentTarget.style.setProperty('--x', `${x}%`);
  e.currentTarget.style.setProperty('--y', `${y}%`);
};
