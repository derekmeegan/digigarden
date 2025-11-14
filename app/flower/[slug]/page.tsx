import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FLOWER_METADATA } from '@/lib/flower-data';
import GardenPage from '@/app/page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: flower, error } = await supabase
    .from('flowers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !flower) {
    return {
      title: 'Flower Not Found | Digigarden'
    };
  }

  const flowerMeta = FLOWER_METADATA[flower.flower];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: `${flower.title} | Digigarden`,
    description: flower.message,
    openGraph: {
      title: flower.title,
      description: flower.message,
      images: [
        {
          url: `${siteUrl}${flowerMeta.image}`,
          width: 800,
          height: 600,
          alt: flower.title,
        }
      ],
      type: 'website',
      url: `${siteUrl}/flower/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: flower.title,
      description: flower.message,
      images: [`${siteUrl}${flowerMeta.image}`],
    }
  };
}

// Server component that renders the main garden page
export default async function FlowerPage({ params }: PageProps) {
  // Client-side will detect the slug from URL and zoom to flower
  return <GardenPage />;
}
