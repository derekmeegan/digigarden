import { FlowerType } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import Image from 'next/image';

interface FlowerSelectorProps {
  selectedFlower: FlowerType;
  onFlowerChange: (flower: FlowerType) => void;
}

export function FlowerSelector({ selectedFlower, onFlowerChange }: FlowerSelectorProps) {
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

  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      {entries.map(([key, meta]) => {
        const isSelected = selectedFlower === key;

        return (
          <button
            key={key}
            onClick={() => onFlowerChange(key as FlowerType)}
            className={'flex flex-col items-center p-4 rounded-lg border-2 transition ' + getFlowerColors(key, isSelected)}
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
          </button>
        );
      })}
    </div>
  );
}
