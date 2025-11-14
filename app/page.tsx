'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Flower } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import CloudsAnimation from '@/components/clouds-animation';
import { MusicPlayer } from '@/components/music-player';
import { DirtPlot } from '@/components/dirt-plot';
import { PlantingDrawer } from '@/components/planting-drawer';
import { FlowerDetailModal } from '@/components/flower-detail-modal';

type UserState = 'normal' | 'viewing' | 'planting';

export default function GardenPage() {
  // State machine
  const [userState, setUserState] = useState<UserState>('normal');

  // Scroll state
  const [offset, setOffset] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [preZoomOffset, setPreZoomOffset] = useState(0); // Store offset before zooming

  // Flower state
  const [allFlowers, setAllFlowers] = useState<Flower[]>([]);
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);
  const [plantingPosition, setPlantingPosition] = useState<{ x: number; y: number } | null>(null);
  const [newlyPlantedFlowerId, setNewlyPlantedFlowerId] = useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear scroll when entering viewing or planting states
  useEffect(() => {
    if (userState !== 'normal') {
      setScrollSpeed(0);
    }
  }, [userState]);

  // Auto-scroll based on cursor position (edge scrolling)
  useEffect(() => {
    if (userState !== 'normal' || scrollSpeed === 0) return;

    let animationFrame: number;
    const scroll = () => {
      setOffset(prev => prev + scrollSpeed);
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [scrollSpeed, userState]);

  // Load all flowers on mount
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/flowers')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load flowers');
        return res.json();
      })
      .then(data => {
        setAllFlowers(data || []);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load garden. Please refresh.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Handle shared flower from URL
  useEffect(() => {
    if (isLoading) return;

    const pathSegments = window.location.pathname.split('/');
    if (pathSegments[1] === 'flower' && pathSegments[2]) {
      const slug = pathSegments[2];

      fetch(`/api/flowers/${slug}`)
        .then(res => {
          if (!res.ok) throw new Error('Flower not found');
          return res.json();
        })
        .then(flower => {
          setAllFlowers(prev => {
            const exists = prev.some(f => f.id === flower.id);
            return exists ? prev : [...prev, flower];
          });

          handleFlowerClick(flower);
        })
        .catch(err => {
          console.error(err);
          setError('Shared flower not found');
        });
    }
  }, [isLoading]);


  // Viewport culling
  const visibleFlowers = useMemo(() => {
    // Show all flowers when viewing or planting (we'll handle their visibility individually)
    if (userState === 'viewing' || userState === 'planting') {
      return allFlowers;
    }

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const buffer = 300;

    return allFlowers.filter(flower => {
      const screenX = flower.x + offset;
      return screenX > -buffer && screenX < viewportWidth + buffer;
    });
  }, [offset, allFlowers, userState, selectedFlower]);

  // Handlers
  const handleFlowerClick = useCallback((flower: Flower) => {
    // Store current offset before zooming
    setPreZoomOffset(offset);
    setSelectedFlower(flower);
    setUserState('viewing');
  }, [offset]);

  const handleExitViewing = useCallback(() => {
    // Restore previous offset when exiting zoom
    setOffset(preZoomOffset);
    setUserState('normal');
    setSelectedFlower(null);
  }, [preZoomOffset]);

  const handleGrassClick = useCallback((e: React.MouseEvent) => {
    if (userState === 'viewing') {
      handleExitViewing();
      return;
    }

    if (userState === 'planting') {
      return;
    }

    // Store current offset before zooming for planting
    setPreZoomOffset(offset);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickX = e.clientX - rect.left;

    if (clickY >= 0 && clickY <= rect.height) {
      const absoluteX = clickX - offset;
      setPlantingPosition({ x: absoluteX, y: clickY });
      setUserState('planting');
    }
  }, [userState, offset, handleExitViewing]);

  const handleExitPlanting = useCallback(() => {
    // Restore previous offset when exiting planting
    setOffset(preZoomOffset);
    setUserState('normal');
    setPlantingPosition(null);
  }, [preZoomOffset]);

  // Handle mouse movement for edge scrolling
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (userState !== 'normal') {
      setScrollSpeed(0);
      return;
    }

    const edgeThreshold = 200; // pixels from edge to start scrolling (increased from 150)
    const maxSpeed = 8; // Maximum scroll speed
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    const distanceFromLeft = e.clientX;
    const distanceFromRight = viewportWidth - e.clientX;

    if (distanceFromLeft < edgeThreshold) {
      // Scroll right (positive offset)
      const intensity = 1 - (distanceFromLeft / edgeThreshold);
      setScrollSpeed(maxSpeed * intensity);
    } else if (distanceFromRight < edgeThreshold) {
      // Scroll left (negative offset)
      const intensity = 1 - (distanceFromRight / edgeThreshold);
      setScrollSpeed(-maxSpeed * intensity);
    } else {
      setScrollSpeed(0);
    }
  }, [userState]);

  const handleMouseLeave = useCallback(() => {
    setScrollSpeed(0);
  }, []);

  const handlePlantSuccess = useCallback((flower: Flower) => {
    setAllFlowers(prev => [...prev, flower]);
    // Mark this flower as newly planted
    setNewlyPlantedFlowerId(flower.id);
    // Remove the glow after 6 seconds (2s animation × 3 iterations)
    setTimeout(() => {
      setNewlyPlantedFlowerId(null);
    }, 6000);
    // Restore offset and exit planting state
    setOffset(preZoomOffset);
    setUserState('normal');
    setPlantingPosition(null);
  }, [preZoomOffset]);


  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg">Loading garden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fixed Background - hoisted up */}
      <div className="absolute inset-0 -top-[35px]">
        <Image
          src="/background.png"
          alt="Garden background"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Clouds Layer */}
      <CloudsAnimation gardenOffset={offset} />

      {/* Music Player */}
      <MusicPlayer />

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}

      {/* Scroll Indicators */}
      {/* DISABLED: horizontal scrolling indicators */}
      {/* {userState === 'normal' && (
        <>
          <div className="absolute left-4 bottom-[40vh] z-20 pointer-events-none">
            <ChevronLeft className="w-16 h-16 text-white/90" strokeWidth={2.5} />
          </div>
          <div className="absolute right-4 bottom-[40vh] z-20 pointer-events-none">
            <ChevronRight className="w-16 h-16 text-white/90" strokeWidth={2.5} />
          </div>
        </>
      )} */}

      {/* Pannable Garden Container */}
      <div
        className="absolute bottom-0 w-full h-[65vh]"
        style={{ overflow: 'visible' }}
        // onMouseMove={handleMouseMove} // DISABLED: horizontal scrolling
        // onMouseLeave={handleMouseLeave} // DISABLED: horizontal scrolling
      >
        <div
          className="relative h-full cursor-shovel"
          onClick={handleGrassClick}
        >
            {/* Dirt Plot Preview */}
            {plantingPosition && userState === 'planting' && (
              <DirtPlot
                x={plantingPosition.x}
                y={plantingPosition.y}
                visible={true}
              />
            )}

            {/* Flowers */}
            {visibleFlowers.map((flower) => {
              const isThisFlowerSelected = selectedFlower?.id === flower.id;
              const isOtherFlowerSelected = selectedFlower !== null && !isThisFlowerSelected;
              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

              const isZoomed = userState === 'viewing' || userState === 'planting';

              // Calculate flower position
              const getFlowerStyle = () => {
                if (userState === 'viewing' && isThisFlowerSelected) {
                  // Move to center - adjusted for better positioning
                  return {
                    left: `${viewportWidth / 2}px`,
                    top: `${viewportHeight * 0.45}px`, // Slightly above center
                    transform: 'translate(-50%, -50%) scale(2)',
                    zIndex: 50,
                  };
                } else if (userState === 'viewing' && isOtherFlowerSelected) {
                  // Hide other flowers - fixed position (no offset)
                  return {
                    left: `${flower.x}px`,
                    top: `${flower.y}px`,
                    opacity: 0,
                    transform: 'scale(0.5)',
                    zIndex: 10,
                  };
                }
                // Normal position (including planting mode) - apply scroll offset
                return {
                  left: `${flower.x + offset}px`,
                  top: `${flower.y}px`,
                  zIndex: 10,
                };
              };

              return (
                <div
                  key={flower.id}
                  className="absolute group transition-all duration-700 ease-in-out cursor-pointer"
                  style={getFlowerStyle()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFlowerClick(flower);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFlowerClick(flower);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${flower.title}`}
                >
                  {/* Expanded clickable area */}
                  <div className="absolute -inset-4 z-0" />

                  <Image
                    src={FLOWER_METADATA[flower.flower].image}
                    alt={flower.title}
                    width={80}
                    height={80}
                    className={`relative z-10 transition ${!isZoomed ? 'hover:scale-110 animate-sway' : ''} ${newlyPlantedFlowerId === flower.id ? 'animate-new-flower' : ''}`}
                    style={{
                      animationDelay: !isZoomed ? `${(flower.x % 20) * 0.1}s` : '0s',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Hover Preview Tooltip */}
                  {userState === 'normal' && !isOtherFlowerSelected && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 9999 }}>
                      <div className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg max-w-[200px] text-center shadow-lg">
                        <p className="font-semibold">{flower.title}</p>
                        <p className="text-xs mt-1 line-clamp-2">{flower.message}</p>
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90 mx-auto"></div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Drawers & Modals */}
      <PlantingDrawer
        isOpen={userState === 'planting'}
        onClose={handleExitPlanting}
        clickPosition={plantingPosition}
        currentOffset={offset}
        onPlantSuccess={handlePlantSuccess}
      />

      <FlowerDetailModal
        flower={selectedFlower}
        isOpen={userState === 'viewing'}
        onClose={handleExitViewing}
      />
    </div>
  );
}
