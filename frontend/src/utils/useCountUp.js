import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * Count-up animation hook. Returns { count, ref }.
 * Attach ref to the container element. Count animates from 0 to `end`
 * when the element scrolls into view.
 * 
 * @param {number} end - Target number
 * @param {number} duration - Animation duration in ms (default 2000)
 * @returns {{ count: number, ref: React.RefObject }}
 */
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView || !end) return;

    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
        return;
      }
      setCount(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return { count, ref };
};

export default useCountUp;
