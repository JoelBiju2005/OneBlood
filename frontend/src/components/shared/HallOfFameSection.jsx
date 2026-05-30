import { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="font-bold tabular-nums">{count.toLocaleString()}</span>;
}

export default function HallOfFameSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/public')
      .then(r => {
        if (r.data && r.data.hallOfFame) {
          setStats(r.data.hallOfFame);
        }
      })
      .catch((err) => console.error('Failed to fetch public stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const metrics = stats ? [
    { icon: '🩸', label: 'Successful Donations', value: stats.totalDonations, color: '#dc2626' },
    { icon: '💉', label: 'Transfusions Completed', value: stats.totalTransfusions, color: '#b91c1c' },
    { icon: '❤️', label: 'Lives Impacted', value: stats.livesSaved, color: '#ef4444' },
    { icon: '🏙️', label: 'Cities Reached', value: stats.citiesReached, color: '#f87171' },
  ] : [];

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-12">
        <span className="inline-block bg-oneblood-crimson/10 border border-oneblood-crimson/30 text-oneblood-crimson_light px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 animate-pulse-slow">
          🏆 Hall of Fame
        </span>
        <h2 className="text-4xl md:text-5xl font-heading text-white mb-4">
          OneBlood's Impact — Since Day One
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto font-body text-base">
          Every number here is a life touched. Every drop donated through OneBlood has made this possible.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-card h-40 bg-white/5 rounded-2xl border border-white/10"></div>
          ))}
        </div>
      ) : metrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {metrics.map(m => (
            <div 
              className="glass-card glass-card-hover p-8 text-center flex flex-col items-center justify-center relative overflow-hidden group" 
              key={m.label}
            >
              {/* Subtle background glow effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${m.color} 0%, transparent 70%)` }}
              ></div>
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {m.icon}
              </div>
              <div className="text-4xl font-heading mb-2 tracking-tight" style={{ color: m.color }}>
                <AnimatedCounter target={m.value} />
              </div>
              <div className="text-sm font-semibold uppercase text-gray-400 tracking-wider font-body">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Failed to load statistics.</p>
      )}
    </section>
  );
}
