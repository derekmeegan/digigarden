'use client';

import { Flower } from '@/types/flower';
import { FLOWER_METADATA } from '@/lib/flower-data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
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

// Assign a color to a tag based on the tag name and flower identifier
// This ensures each flower gets different random colors for its tags
const getTagColor = (tag: string, flowerId: string): { bg: string; text: string } => {
  // Combine tag name with flower ID to create a unique hash
  // This makes colors random per flower but consistent for the same flower
  const combined = `${tag.toLowerCase()}-${flowerId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get an index
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
};

export function FlowerDetailModal({ flower, isOpen, onClose }: FlowerDetailModalProps) {
  if (!flower) return null;

  const flowerMeta = FLOWER_METADATA[flower.flower];
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/flower/${flower.slug}` : '';

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

  const handleShareiMessage = () => {
    const body = encodeURIComponent(`Check out this flower: ${shareUrl}`);
    window.location.href = `sms:&body=${body}`;
    toast.success('Opening Messages...');
  };

  const handleShareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.info('Link copied!', {
        description: 'Paste it in your Instagram bio or DM.',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] sm:w-[650px] overflow-y-auto p-8">
        <SheetHeader>
          <SheetTitle className="text-2xl">{flower.title}</SheetTitle>
          <SheetDescription>
            {flowerMeta.name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-8">
          <div className="flex justify-center">
            <Image
              src={flowerMeta.image}
              alt={flowerMeta.name}
              width={128}
              height={128}
              className="w-32 h-32 object-contain"
            />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">{flowerMeta.description}</p>
            <div className="flex gap-2 flex-wrap">
              {flowerMeta.tags.map(tag => {
                const colors = getTagColor(tag, flower.slug);
                return (
                  <span 
                    key={tag} 
                    className="px-2 py-1 text-xs rounded"
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
          </div>

          <div className="border-t pt-4">
            <p className="text-lg leading-relaxed">{flower.message}</p>
            {flower.author && (
              <p className="text-sm text-gray-500 mt-3">— {flower.author}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Share this flower</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareTwitter}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                X (Twitter)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareFacebook}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareiMessage}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                iMessage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareInstagram}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Instagram
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
