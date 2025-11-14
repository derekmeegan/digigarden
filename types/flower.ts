export type FlowerType = 'red-tulip' | 'yellow-sunflower' | 'blue-forget-me-not' | 'white-rose' | 'pink-carnation' | 'orange-lily';

export interface Flower {
  id: string;
  title: string;
  slug: string;
  message: string;
  author: string | null;
  flower: FlowerType;
  x: number;
  y: number;
  created_at: string;
}

export interface FlowerMetadata {
  name: string;
  description: string;
  tags: string[];
  image: string;
}
