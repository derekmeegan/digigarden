import { FlowerType } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import Image from 'next/image';
import { useState, useRef } from 'react';

interface FlowerSelectorProps {
  selectedFlower: FlowerType;
  onFlowerChange: (flower: FlowerType) => void;
}

export function FlowerSelector({ selectedFlower, onFlowerChange }: FlowerSelectorProps) {
  const [hoveredFlower, setHoveredFlower] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const getFlowerColors = (flowerKey: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'border-gray-200 bg-white hover:border-gray-400';
    }

    switch (flowerKey) {
      case 'red-tulip':
        return 'border-red-300 bg-red-50';
      case 'white-rose':
        return 'border-gray-300 bg-gray-50';
      case 'yellow-sunflower':
        return 'border-yellow-300 bg-yellow-50';
      case 'pink-carnation':
        return 'border-pink-300 bg-pink-50';
      case 'blue-forget-me-not':
        return 'border-blue-300 bg-blue-50';
      case 'orange-lily':
        return 'border-orange-300 bg-orange-50';
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  const entries = Object.entries(FLOWER_METADATA);

  const handleMouseEnter = (key: string) => {
    // Start timer for 800ms before showing tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredFlower(key);
    }, 800);
  };

  const handleMouseLeave = () => {
    // Clear timer if user stops hovering before delay
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredFlower(null);
  };

  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      {entries.map(([key, meta]) => {
        const isSelected = selectedFlower === key;
        const showTooltip = hoveredFlower === key;

        return (
          <button
            key={key}
            onClick={() => onFlowerChange(key as FlowerType)}
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
            className={'relative flex flex-col items-center p-4 rounded-lg border-2 transition ' + getFlowerColors(key, isSelected)}
            type="button"
          >
            <Image
              src={meta.image}
              alt={meta.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
            <span className="text-sm mt-2 text-center font-medium">{meta.name}</span>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 animate-in fade-in duration-200 pointer-events-none z-50">
                <div className="bg-white text-gray-800 text-xs px-3 py-2 rounded-lg min-w-[200px] max-w-[250px] text-center shadow-lg border border-gray-200">
                  <p className="font-medium">{meta.description}</p>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white mx-auto"></div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
