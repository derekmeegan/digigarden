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
import { InfoModal } from '@/components/info-modal';

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

  // Sun blink state
  const [sunImage, setSunImage] = useState('/sun.png');
  const sunHoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sunBlinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSunHovered, setIsSunHovered] = useState(false);

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

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathSegments = window.location.pathname.split('/');

      if (pathSegments[1] === 'flower' && pathSegments[2]) {
        // User navigated to a flower URL
        const slug = pathSegments[2];
        const flower = allFlowers.find(f => f.slug === slug);

        if (flower) {
          setPreZoomOffset(offset);
          setSelectedFlower(flower);
          setUserState('viewing');
        }
      } else {
        // User navigated back to home
        if (userState === 'viewing') {
          setOffset(preZoomOffset);
          setUserState('normal');
          setSelectedFlower(null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allFlowers, offset, userState, preZoomOffset]);


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
    // Update URL with flower slug for sharing
    window.history.pushState({}, '', `/flower/${flower.slug}`);
  }, [offset]);

  const handleExitViewing = useCallback(() => {
    // Restore previous offset when exiting zoom
    setOffset(preZoomOffset);
    setUserState('normal');
    setSelectedFlower(null);
    // Return to home URL
    window.history.pushState({}, '', '/');
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
    // Remove the glow after 12.5 seconds (2.5s animation × 5 iterations)
    setTimeout(() => {
      setNewlyPlantedFlowerId(null);
    }, 12500);
    // Restore offset and exit planting state
    setOffset(preZoomOffset);
    setUserState('normal');
    setPlantingPosition(null);
  }, [preZoomOffset]);

  // Sun blink function
  const triggerSunBlink = useCallback(() => {
    setSunImage('/sun_blink.png');
    setTimeout(() => {
      setSunImage('/sun.png');
    }, 200); // Blink duration: 200ms
  }, []);

  // Sun hover handlers
  const handleSunMouseEnter = useCallback(() => {
    setIsSunHovered(true);
    // Start timer for 2 seconds before first blink
    sunHoverTimerRef.current = setTimeout(() => {
      triggerSunBlink();
      // Continue blinking every 3 seconds while hovered
      sunBlinkIntervalRef.current = setInterval(() => {
        triggerSunBlink();
      }, 3000);
    }, 2000);
  }, [triggerSunBlink]);

  const handleSunMouseLeave = useCallback(() => {
    setIsSunHovered(false);
    // Clear initial timer
    if (sunHoverTimerRef.current) {
      clearTimeout(sunHoverTimerRef.current);
      sunHoverTimerRef.current = null;
    }
    // Clear ongoing blink interval
    if (sunBlinkIntervalRef.current) {
      clearInterval(sunBlinkIntervalRef.current);
      sunBlinkIntervalRef.current = null;
    }
  }, []);

  const handleSunClick = useCallback(() => {
    triggerSunBlink();
  }, [triggerSunBlink]);


  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-blue-50">
        <div className="animate-spin">
          <Image
            src="/special_flower.png"
            alt="Loading"
            width={150}
            height={150}
            className="w-[150px] h-[150px] object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fixed Background - hoisted up */}
      <div className="absolute inset-0 -top-[35px] z-0">
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

      {/* Sun */}
      <div
        className="absolute top-8 left-16 z-[5] cursor-pointer"
        onMouseEnter={handleSunMouseEnter}
        onMouseLeave={handleSunMouseLeave}
        onClick={handleSunClick}
      >
        <Image
          src={sunImage}
          alt="Sun"
          width={200}
          height={200}
          priority
        />
      </div>

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
                x={plantingPosition.x + preZoomOffset}
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
                    left: `${viewportWidth / 2 - 150}px`,
                    top: `${viewportHeight * 0.15}px`, // Higher on screen
                    transform: 'translate(-50%, -50%) scale(3)', // Larger scale
                    zIndex: 50,
                  };
                } else if (userState === 'viewing' && isOtherFlowerSelected) {
                  // Hide other flowers - use preZoomOffset (position when zoom started)
                  return {
                    left: `${flower.x + preZoomOffset}px`,
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
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                };
              };

              const flowerStyle = getFlowerStyle();
              const { zIndex, ...restStyle } = flowerStyle;

              return (
                <div
                  key={flower.id}
                  className="absolute group transition-all duration-700 ease-in-out flower-clickable hover:!z-[100]"
                  style={{ ...restStyle, zIndex }}
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
                    width={flower.flower === 'blue-forget-me-not' || flower.flower === 'white-rose' ? 115 : 100}
                    height={flower.flower === 'blue-forget-me-not' || flower.flower === 'white-rose' ? 115 : 100}
                    className={`relative z-[1] transition ${!isZoomed ? 'hover:scale-110 animate-sway flower-hover-glow' : ''} ${
                      newlyPlantedFlowerId === flower.id
                        ? 'animate-new-flower'
                        : (isThisFlowerSelected && userState === 'viewing')
                          ? 'animate-viewing-flower'
                          : ''
                    }`}
                    style={{
                      animationDelay: !isZoomed ? `${(flower.x % 20) * 0.1}s` : '0s'
                    }}
                  />

                  {/* Hover Preview Tooltip */}
                  {userState === 'normal' && !isOtherFlowerSelected && (() => {
                    // Get tooltip colors based on flower type
                    const getTooltipColors = () => {
                      switch (flower.flower) {
                        case 'red-tulip':
                          return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', arrow: 'border-t-red-50' };
                        case 'white-rose':
                          return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900', arrow: 'border-t-gray-50' };
                        case 'yellow-sunflower':
                          return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', arrow: 'border-t-yellow-50' };
                        case 'pink-carnation':
                          return { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-900', arrow: 'border-t-pink-50' };
                        case 'blue-forget-me-not':
                          return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', arrow: 'border-t-blue-50' };
                        case 'orange-lily':
                          return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', arrow: 'border-t-orange-50' };
                        default:
                          return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900', arrow: 'border-t-gray-50' };
                      }
                    };

                    const colors = getTooltipColors();
                    // Truncate title if longer than 40 characters
                    const displayTitle = flower.title.length > 40
                      ? flower.title.slice(0, 40) + '...'
                      : flower.title;

                    return (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[20]">
                        <div className={`${colors.bg} ${colors.text} text-sm px-5 py-3 rounded-lg min-w-[150px] max-w-[350px] text-center shadow-lg border-2 ${colors.border}`}>
                          <p className="font-semibold text-base">{displayTitle}</p>
                          {flower.author && (
                            <p className="text-xs mt-1 opacity-75">by {flower.author}</p>
                          )}
                        </div>
                        <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${colors.arrow} mx-auto`}></div>
                      </div>
                    );
                  })()}
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

      {/* Info Modal */}
      <InfoModal />
    </div>
  );
}
