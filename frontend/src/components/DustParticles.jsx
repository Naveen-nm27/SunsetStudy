import { useEffect, useState } from 'react';

export default function DustParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate 30 random particles
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${-(Math.random() * 10 + 2)}%`,
      size: `${Math.random() * 5 + 2}px`,
      duration: `${Math.random() * 12 + 8}s`,
      delay: `${Math.random() * 8}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-55 dark:opacity-100 transition-opacity duration-500">
      {particles.map((p) => (
        <div
          key={p.id}
          className="dust-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
