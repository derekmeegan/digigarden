'use client';

import { useMemo } from 'react';

export default function CloudsAnimation() {
  // Generate random starting positions for clouds on mount
  const clouds = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    return [
      { id: 1, top: '5%', startX: Math.random() * viewportWidth, duration: 60 },
      { id: 2, top: '15%', startX: Math.random() * viewportWidth, duration: 80 },
      { id: 3, top: '8%', startX: Math.random() * viewportWidth, duration: 70 },
      { id: 4, top: '20%', startX: Math.random() * viewportWidth, duration: 90 },
      { id: 5, top: '12%', startX: Math.random() * viewportWidth, duration: 75 },
      { id: 6, top: '18%', startX: Math.random() * viewportWidth, duration: 65 },
    ];
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[20%] overflow-hidden pointer-events-none">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            top: cloud.top,
            left: `${cloud.startX}px`,
            animationDuration: `${cloud.duration}s`,
          }}
        >
          <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
            <ellipse cx="30" cy="30" rx="25" ry="20" fill="white" fillOpacity="0.7" />
            <ellipse cx="60" cy="25" rx="35" ry="25" fill="white" fillOpacity="0.7" />
            <ellipse cx="90" cy="30" rx="30" ry="20" fill="white" fillOpacity="0.7" />
          </svg>
        </div>
      ))}
    </div>
  );
}
