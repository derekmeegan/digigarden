'use client';

import { useMemo, useEffect, useState } from 'react';

interface CloudsAnimationProps {
  gardenOffset: number;
}

export default function CloudsAnimation({ gardenOffset }: CloudsAnimationProps) {
  const [cloudPositions, setCloudPositions] = useState<{ id: number; x: number; top: string; speed: number }[]>([]);

  // Initialize clouds on mount
  useEffect(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    const initialClouds = [
      { id: 1, top: '2%', x: Math.random() * viewportWidth, speed: 0.5 },
      { id: 2, top: '25%', x: Math.random() * viewportWidth, speed: 0.3 },
      { id: 3, top: '8%', x: Math.random() * viewportWidth, speed: 0.4 },
      { id: 4, top: '30%', x: Math.random() * viewportWidth, speed: 0.25 },
      { id: 5, top: '12%', x: Math.random() * viewportWidth, speed: 0.45 },
      { id: 6, top: '18%', x: Math.random() * viewportWidth, speed: 0.35 },
      { id: 7, top: '5%', x: Math.random() * viewportWidth, speed: 0.42 },
      { id: 8, top: '35%', x: Math.random() * viewportWidth, speed: 0.28 },
      { id: 9, top: '15%', x: Math.random() * viewportWidth, speed: 0.48 },
      { id: 10, top: '28%', x: Math.random() * viewportWidth, speed: 0.38 },
    ];

    setCloudPositions(initialClouds);
  }, []);

  // Animate clouds
  useEffect(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    let animationFrame: number;

    const animate = () => {
      setCloudPositions(prev => prev.map(cloud => {
        let newX = cloud.x + cloud.speed;

        // If cloud goes past right edge of viewport, wrap to left edge
        if (newX > viewportWidth + 150) {
          newX = -150;
        }

        return { ...cloud, x: newX };
      }));

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[30%] overflow-hidden pointer-events-none">
      {cloudPositions.map(cloud => (
        <div
          key={cloud.id}
          className="absolute transition-none"
          style={{
            top: cloud.top,
            left: `${cloud.x}px`,
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
