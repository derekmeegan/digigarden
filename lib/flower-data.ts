import { FlowerType, FlowerMetadata } from '@/types/flower';

export const FLOWER_METADATA: Record<FlowerType, FlowerMetadata> = {
  'red-tulip': {
    name: 'Red Tulip',
    description: 'Chosen to express love and passion.',
    tags: ['Passionate', 'Bold', 'Romantic'],
    image: '/tulip.png'
  },
  'white-rose': {
    name: 'White Rose',
    description: 'A symbol of purity and remembrance.',
    tags: ['Pure', 'Serene', 'Timeless'],
    image: '/rose.png'
  },
  'yellow-sunflower': {
    name: 'Sunflower',
    description: 'Represents warmth, joy, and loyalty.',
    tags: ['Radiant', 'Cheerful', 'Loyal'],
    image: '/sunflower.png'
  },
  'pink-carnation': {
    name: 'Carnation',
    description: 'Given to show admiration and gratitude.',
    tags: ['Sweet', 'Grateful', 'Gentle'],
    image: '/carnation.png'
  },
  'blue-forget-me-not': {
    name: 'Forget-Me-Not',
    description: 'A promise of lasting memory and connection.',
    tags: ['Dreamy', 'Eternal', 'Remembered'],
    image: '/fmn.png'
  },
  'orange-lily': {
    name: 'Orange Lily',
    description: 'A symbol of confidence, pride, and wealth.',
    tags: ['Vibrant', 'Confident', 'Energetic'],
    image: '/lily.png'
  }
};

// Helper to generate URL-friendly slug from title with UUID suffix
export function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .slice(0, 50);             // Truncate to max 50 characters

  // Append short UUID to ensure uniqueness while keeping slugs pretty
  const uniqueId = crypto.randomUUID().split('-')[0]; // First 8 chars of UUID
  return `${baseSlug}-${uniqueId}`;
}
