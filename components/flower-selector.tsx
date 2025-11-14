import { FlowerType } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import Image from 'next/image';

interface FlowerSelectorProps {
  selectedFlower: FlowerType;
  onFlowerChange: (flower: FlowerType) => void;
}

export function FlowerSelector({ selectedFlower, onFlowerChange }: FlowerSelectorProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 my-4">
      {Object.entries(FLOWER_METADATA).map(([key, meta]) => {
        const isSelected = selectedFlower === key;
        return (
          <button
            key={key}
            onClick={() => onFlowerChange(key as FlowerType)}
            className={'flex flex-col items-center p-3 rounded-lg border-2 transition ' + (isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-400')}
            type="button"
          >
            <Image
              src={meta.image}
              alt={meta.name}
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
            />
            <span className="text-xs mt-2 text-center">{meta.name}</span>
          </button>
        );
      })}
    </div>
  );
}
