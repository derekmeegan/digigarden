'use client';

import { Flower } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Facebook, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface FlowerDetailModalProps {
  flower: Flower | null;
  isOpen: boolean;
  onClose: () => void;
}

// Pastel color palette
const PASTEL_COLORS = [
  { bg: '#9bf6ff', text: '#0d4a52' }, // blue
  { bg: '#caffbf', text: '#2d5a1f' }, // green
  { bg: '#fdffb6', text: '#6b6d00' }, // yellow
  { bg: '#ffd6a5', text: '#8b5a00' }, // orange
  { bg: '#ffadad', text: '#7f1f1f' }, // red
];

// Shuffle array using Fisher-Yates algorithm with seeded random
const seededShuffle = (array: typeof PASTEL_COLORS, seed: string) => {
  const arr = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const random = (max: number) => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280 * max;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Get shuffled colors for a specific flower (no repeats)
const getShuffledColorsForFlower = (flowerId: string): typeof PASTEL_COLORS => {
  return seededShuffle(PASTEL_COLORS, flowerId);
};

// Assign a color to a tag based on its index and flower identifier
// This ensures no color repeats within a flower's tags
const getTagColor = (tag: string, flowerId: string, tagIndex: number): { bg: string; text: string } => {
  const shuffledColors = getShuffledColorsForFlower(flowerId);
  const color = shuffledColors[tagIndex % shuffledColors.length];
  // Fallback to first color if undefined
  return color || PASTEL_COLORS[0];
};

// Get background color based on flower type (matching tooltip/planting drawer)
const getFlowerBgColor = (flowerType: string) => {
  switch (flowerType) {
    case 'red-tulip':
      return 'bg-red-50';
    case 'white-rose':
      return 'bg-gray-50';
    case 'yellow-sunflower':
      return 'bg-yellow-50';
    case 'pink-carnation':
      return 'bg-pink-50';
    case 'blue-forget-me-not':
      return 'bg-blue-50';
    case 'orange-lily':
      return 'bg-orange-50';
    default:
      return 'bg-gray-50';
  }
};

export function FlowerDetailModal({ flower, isOpen, onClose }: FlowerDetailModalProps) {
  if (!flower) return null;

  const flowerMeta = FLOWER_METADATA[flower.flower];
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/flower/${flower.slug}` : '';
  const bgColor = getFlowerBgColor(flower.flower);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!', {
        description: 'Share this flower with your friends.',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${flower.title} - ${flower.message}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    toast.success('Opening Twitter...');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    toast.success('Opening Facebook...');
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay
          className="fixed inset-0 z-50 bg-transparent cursor-pointer"
          onClick={onClose}
        />
        <SheetPrimitive.Content
          className={`${bgColor} fixed z-50 flex flex-col shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-[350px] sm:w-[450px] border-l overflow-y-auto p-8`}
        >
          <SheetPrimitive.Title className="sr-only">
            {flower.title}
          </SheetPrimitive.Title>
          <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none z-10">
            <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>

        <div className="flex flex-col items-center space-y-6 mt-8">
          {/* Title */}
          <div className="w-full mb-2">
            <h2 className="text-2xl font-bold">{flower.title}</h2>
          </div>

          {/* Share Buttons */}
          <div className="w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="h-8 w-8"
                title="Copy Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShareFacebook}
                className="h-8 w-8"
                title="Share on Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShareTwitter}
                className="h-8 w-8"
                title="Share on Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Flower Image */}
          <div className="flex justify-center">
            <Image
              src={flowerMeta.image}
              alt={flowerMeta.name}
              width={200}
              height={200}
              className="w-50 h-50 object-contain"
            />
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap justify-center">
            {flowerMeta.tags.map((tag, index) => {
              const colors = getTagColor(tag, flower.slug, index);
              return (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Flower Description */}
          <div className="text-center">
            <p className="text-sm text-gray-700">{flowerMeta.description}</p>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-gray-300" />

          {/* Message and Author */}
          <div className="w-full text-center">
            <p className="text-lg leading-relaxed mb-3">{flower.message}</p>
            {flower.author && (
              <p className="text-sm text-gray-600">— {flower.author}</p>
            )}
          </div>
        </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </Sheet>
  );
}
