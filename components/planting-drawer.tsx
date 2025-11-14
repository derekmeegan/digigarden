'use client';

import { useState } from 'react';
import { Flower, FlowerType } from '@/types/flower';
import { FlowerSelector } from './flower-selector';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface PlantingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clickPosition: { x: number; y: number } | null;
  currentOffset: number;
  onPlantSuccess: (flower: Flower) => void;
}

export function PlantingDrawer({ 
  isOpen, 
  onClose, 
  clickPosition,
  currentOffset,
  onPlantSuccess 
}: PlantingDrawerProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedFlower, setSelectedFlower] = useState<FlowerType>('yellow-sunflower');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!clickPosition) {
      toast.error('Invalid planting position');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          author: author.trim() || null,
          x: clickPosition.x,
          y: clickPosition.y,
          flower: selectedFlower,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to plant flower');
      }

      const newFlower = await response.json();
      
      toast.success('Flower planted!', {
        description: 'Your message has been added to the garden.',
      });

      onPlantSuccess(newFlower);
      
      // Reset form
      setTitle('');
      setMessage('');
      setAuthor('');
      setSelectedFlower('yellow-sunflower');
    } catch (error) {
      console.error('Error planting flower:', error);
      toast.error('Failed to plant flower', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setAuthor('');
    setSelectedFlower('yellow-sunflower');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[500px] sm:w-[650px] overflow-y-auto p-8">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="text-6xl">☀️</div>
            <div className="flex-1">
              <SheetTitle>Plant a Flower</SheetTitle>
              <SheetDescription>
                Share a positive message with the world
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your message a title"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your positive thoughts..."
              required
              rows={4}
              maxLength={500}
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Choose a Flower <span className="text-red-500">*</span>
            </label>
            <FlowerSelector 
              selectedFlower={selectedFlower}
              onFlowerChange={setSelectedFlower}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Planting...' : 'Plant Flower'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
