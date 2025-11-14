# Digigarden Implementation Plan

## Project Overview
Build a delightful full-stack web experience where users can plant digital flowers with positive messages and share them with others.

**Stack:** TypeScript, Next.js, TailwindCSS, Supabase, Vercel, Shadcn

---

## HUMAN SETUP TASKS (Do These First)

### 1. Supabase Project Setup
- [ ] Create a new Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy your project URL and anon key
- [ ] Create `.env.local` file in project root with:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

### 2. Create Database Table
Go to your Supabase project → SQL Editor → New Query, and run:

```sql
-- Create flowers table
CREATE TABLE flowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  author TEXT,
  flower TEXT NOT NULL CHECK (flower IN ('red-tulip', 'yellow-sunflower', 'blue-forget-me-not', 'white-rose', 'pink-carnation')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_flowers_x ON flowers(x);
CREATE INDEX idx_flowers_slug ON flowers(slug);
```

### 3. Verify Table Creation
- [ ] Go to Table Editor in Supabase dashboard
- [ ] Confirm `flowers` table exists with all columns
- [ ] Confirm index `idx_flowers_x` exists (check Indexes tab)

### 4. Seed Database with Starter Flowers (Optional but Recommended)
Add a few example flowers so the garden isn't empty on first visit:

```sql
INSERT INTO flowers (title, slug, message, author, flower, x, y) VALUES
  ('Welcome to Digigarden', 'welcome-to-digigarden', 'Plant your positive thoughts and watch them grow!', 'The Gardeners', 'yellow-sunflower', 0, 200),
  ('Gratitude Blooms', 'gratitude-blooms', 'Thank you for being here and sharing your light.', 'Anonymous', 'pink-carnation', -400, 150),
  ('Stay Strong', 'stay-strong', 'You are braver than you believe, stronger than you seem.', 'A Friend', 'red-tulip', 500, 180),
  ('Peace and Love', 'peace-and-love', 'May your days be filled with peace and your heart with love.', 'Kindness Keeper', 'white-rose', -800, 220),
  ('Remember Me', 'remember-me', 'Every moment matters. Make today count.', 'Time Traveler', 'blue-forget-me-not', 900, 160);
```

**Note:** This is a single-table data model. No additional tables needed.

---

## IMPLEMENTER 1: Database, API & Backend Infrastructure

### Tasks

#### 1. Supabase Setup
- [ ] Set up environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Initialize Supabase client in `lib/supabase.ts`

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Install Supabase client:**
```bash
npm install @supabase/supabase-js
```

#### 2. Database Schema

**Note:** Database table is created in HUMAN SETUP TASKS section. Reference for implementers:

**Columns:**
- `id`: UUID (primary key)
- `title`: string (required)
- `slug`: string (required, unique) - URL-friendly version of title for sharing
- `message`: string (required)
- `author`: string (optional)
- `flower`: string (required) - one of: 'red-tulip', 'yellow-sunflower', 'blue-forget-me-not', 'white-rose', 'pink-carnation'
- `x`: integer (required) - fixed X coordinate in infinite scroll
- `y`: integer (required) - fixed Y coordinate within grass area
- `created_at`: timestamp

**Note:** Slugs are automatically made unique by appending a short UUID (e.g., "my-message-a1b2c3d4").

#### 3. API Endpoints

**File:** `app/api/flowers/route.ts`

**GET /api/flowers/list**
- Query parameters: `minX`, `maxX` (for region-based loading)
- Returns all flowers or filtered by X-coordinate range
- Response: Array of flower objects

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minX = searchParams.get('minX');
  const maxX = searchParams.get('maxX');

  let query = supabase.from('flowers').select('*');

  if (minX) query = query.gte('x', parseInt(minX));
  if (maxX) query = query.lte('x', parseInt(maxX));

  const { data, error } = await query;
  return Response.json(data);
}
```

**POST /api/flowers**
- Body: `{ title, message, author, x, y, flower }`
- Validates required fields (title, message, x, y, flower)
- Auto-generates slug from title
- Creates new flower in database
- Returns created flower object or 409 error if slug exists

```typescript
import { generateSlug } from '@/lib/flower-data';

export async function POST(request: Request) {
  const body = await request.json();
  const { title, message, author, x, y, flower } = body;

  // Validation
  if (!title || !message || x === undefined || y === undefined || !flower) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate slug from title
  const slug = generateSlug(title);

  const { data, error } = await supabase
    .from('flowers')
    .insert({ title, slug, message, author, x, y, flower })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

**GET /api/flowers/[slug]** (new endpoint for sharing)

Create `app/api/flowers/[slug]/route.ts`:

```typescript
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await supabase
    .from('flowers')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Flower not found' }, { status: 404 });
  }

  return Response.json(data);
}
```

#### 4. Type Definitions

**File:** `types/flower.ts`

```typescript
export type FlowerType = 'red-tulip' | 'yellow-sunflower' | 'blue-forget-me-not' | 'white-rose' | 'pink-carnation';

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
```

#### 5. Flower Metadata Constants

**File:** `lib/flower-data.ts`

```typescript
import { FlowerType, FlowerMetadata } from '@/types/flower';

export const FLOWER_METADATA: Record<FlowerType, FlowerMetadata> = {
  'red-tulip': {
    name: 'Red Tulip',
    description: 'Chosen to express love and passion.',
    tags: ['Passionate', 'Bold', 'Romantic'],
    image: '/red-tulip.png'
  },
  'white-rose': {
    name: 'White Rose',
    description: 'A symbol of purity and remembrance.',
    tags: ['Pure', 'Serene', 'Timeless'],
    image: '/white-rose.png'
  },
  'yellow-sunflower': {
    name: 'Sunflower',
    description: 'Represents warmth, joy, and loyalty.',
    tags: ['Radiant', 'Cheerful', 'Loyal'],
    image: '/yellow-sunflower.png'
  },
  'pink-carnation': {
    name: 'Carnation',
    description: 'Given to show admiration and gratitude.',
    tags: ['Sweet', 'Grateful', 'Gentle'],
    image: '/pink-carnation.png'
  },
  'blue-forget-me-not': {
    name: 'Forget-Me-Not',
    description: 'A promise of lasting memory and connection.',
    tags: ['Dreamy', 'Eternal', 'Remembered'],
    image: '/blue-forget-me-not.png'
  }
};

// Helper to generate URL-friendly slug from title with UUID suffix
export function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-');      // Replace multiple hyphens with single

  // Append short UUID to ensure uniqueness while keeping slugs pretty
  const uniqueId = crypto.randomUUID().split('-')[0]; // First 8 chars of UUID
  return `${baseSlug}-${uniqueId}`;
}
```

#### 6. Testing
- [ ] Test GET endpoint returns flowers
- [ ] Test POST endpoint creates flowers with valid data
- [ ] Test POST endpoint rejects invalid data
- [ ] Test X-coordinate range filtering works

---

## IMPLEMENTER 2: UI Components & Planting Flow

### Tasks

#### 1. Shadcn UI Setup
- [ ] Verify shadcn is configured (`components.json` exists)
- [ ] Install required components:
  ```bash
  npx shadcn@latest add dialog
  npx shadcn@latest add button
  npx shadcn@latest add input
  npx shadcn@latest add textarea
  npx shadcn@latest add toast
  npx shadcn@latest add sheet
  npx shadcn@latest add radio-group
  ```

#### 2. Flower Selector Component

**File:** `components/flower-selector.tsx`

- **Inline tile-based selector** (not a separate drawer/sheet)
- Display all 5 flower options as clickable image tiles in a grid
- Each tile shows:
  - Flower image (prominent)
  - Flower name below
- Visual highlight/border on selected flower
- Grid layout: 5 columns on desktop, 3 on mobile

```typescript
interface FlowerSelectorProps {
  selectedFlower: FlowerType;
  onFlowerChange: (flower: FlowerType) => void;
}

// Example implementation
export function FlowerSelector({ selectedFlower, onFlowerChange }: FlowerSelectorProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 my-4">
      {Object.entries(FLOWER_METADATA).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => onFlowerChange(key as FlowerType)}
          className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
            selectedFlower === key
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <img src={meta.image} alt={meta.name} className="w-16 h-16" />
          <span className="text-xs mt-2 text-center">{meta.name}</span>
        </button>
      ))}
    </div>
  );
}
```

#### 3. Planting Drawer Component

**File:** `components/planting-drawer.tsx`

- Uses shadcn Sheet (vertical drawer from bottom)
- Shows when user clicks on grass area
- **Automatically zooms/centers on the clicked position** (like flower detail view)
- Form fields:
  - Title (required) - Input
  - Message (required) - Textarea
  - Author (optional) - Input
  - Flower type selector (inline FlowerSelector component with image tiles)
- Displays dirt plot preview at clicked location (centered in viewport during planting)
- "Plant" button triggers POST to `/api/flowers`
- Close/Cancel button (exits zoom state, closes drawer)
- Form validation
- Loading state during API call
- Auto-generates slug from title
- **State management:** When drawer opens, enter "planting zoom" state similar to flower zoom

```typescript
interface PlantingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clickPosition: { x: number; y: number } | null;
  currentOffset: number;
  onPlantSuccess: (flower: Flower) => void;
  onZoomStateChange?: (isZoomed: boolean) => void; // Coordinate zoom state with parent
}
```

**Behavior:**
- When drawer opens → center/zoom on planting position
- When drawer closes → zoom out to normal view
- Dirt plot remains centered during planting flow

#### 4. Flower Detail Modal Component

**File:** `components/flower-detail-modal.tsx`

- Shows when user clicks on a planted flower
- **Triggers zoom-in state** (communicate to parent via callback)
- Displays:
  - Flower image (larger, centered)
  - Title
  - Message
  - Author (if provided)
  - Flower metadata (description, tags)
- Share functionality (REQUIRED):
  - Copy link to clipboard button
  - Link format: `${window.location.origin}/flower/${flower.slug}`
  - Social media share buttons:
    - **iMessage**: `sms:&body=Check out this flower: ${url}`
    - **X (Twitter)**: `https://twitter.com/intent/tweet?text=${encodeURIComponent(flower.title + ' - ' + flower.message)}&url=${url}`
    - **Facebook**: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    - **Instagram**: Copy link + show instruction (Instagram doesn't support direct URL sharing)
  - Shows toast notification on copy/share
- Close button (returns to normal view)

```typescript
interface FlowerDetailModalProps {
  flower: Flower | null;
  isOpen: boolean;
  onClose: () => void;
  onZoomStateChange?: (isZoomed: boolean) => void;
}
```

#### 5. Toast Notifications Setup

Install toast component:
```bash
npx shadcn@latest add toast
```

**Add Toaster to root layout:**

**File:** `app/layout.tsx`

```typescript
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Usage in components:**
```typescript
import { useToast } from "@/components/ui/use-toast"

// In component
const { toast } = useToast()

// Show toast
toast({
  title: "Flower planted!",
  description: "Your message has been added to the garden.",
})

// Error toast
toast({
  title: "Error",
  description: "Failed to plant flower. Please try again.",
  variant: "destructive",
})

// Link copied toast
toast({
  title: "Link copied!",
  description: "Share this flower with your friends.",
})
```

**Configure toast for:**
- Flower planted successfully
- Link copied to clipboard
- Share button clicked
- Error messages (API failures, slug conflicts)

#### 6. Cursor Customization & Animations

**File:** `app/globals.css`

Add custom cursor styles, wind sway animation, and cloud drift:

```css
.cursor-shovel {
  cursor: url('/shovel.png') 16 16, pointer;
}

.cursor-planting {
  cursor: url('/shovel.png') 16 16, pointer;
}

/* Gentle wind sway animation for flowers */
@keyframes sway {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(2deg);
  }
  75% {
    transform: rotate(-2deg);
  }
}

.animate-sway {
  animation: sway 3s ease-in-out infinite;
  transform-origin: bottom center;
}

/* Cloud drift animation */
.cloud {
  position: absolute;
  animation: drift linear infinite;
  will-change: transform;
}

@keyframes drift {
  from {
    transform: translateX(-150px);
  }
  to {
    transform: translateX(calc(100vw + 150px));
  }
}
```

#### 7. Dirt Plot Component

**File:** `components/dirt-plot.tsx`

- Shows dirt plot image at planting location
- Positioned absolutely
- Visible while planting modal is open
- Fades in/out with animation

```typescript
interface DirtPlotProps {
  x: number;
  y: number;
  visible: boolean;
}
```

#### 8. Integration Points
- Export all components with proper TypeScript interfaces
- Ensure components use flower metadata from `lib/flower-data.ts`
- Implement proper error handling and loading states
- Add accessibility attributes (ARIA labels, keyboard navigation)

---

## IMPLEMENTER 3: Garden Canvas & Interactive Features

### Tasks

#### 1. Main Garden Page Component

**File:** `app/page.tsx`

**IMPORTANT:** Add `'use client'` directive at the top of the file (required for hooks)

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
// ... other imports
```

Core functionality:
- Infinite horizontal scroll mechanism
- Fixed background image
- Pannable grass overlay
- Flower rendering with viewport culling
- Click detection for planting
- Click detection for flower details

#### 2. Infinite Scroll Implementation

**State Management:**
```typescript
// User state machine - mutually exclusive states
type UserState = 'normal' | 'viewing' | 'planting';

const [userState, setUserState] = useState<UserState>('normal');
const [offset, setOffset] = useState(0); // X-axis offset
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState(0);
const [velocity, setVelocity] = useState(0);
const [allFlowers, setAllFlowers] = useState<Flower[]>([]);
const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null); // For viewing state
const [plantingPosition, setPlantingPosition] = useState<{ x: number; y: number } | null>(null);
```

**Pan/Drag Handlers:**
- `handlePointerDown` - Start drag (only in 'normal' state)
- `handlePointerMove` - Update offset during drag
- `handlePointerUp` - End drag, calculate momentum
- Momentum physics with friction (0.95 multiplier)
- **Disable panning when in 'viewing' or 'planting' states**

**Momentum cleanup when changing states:**
```typescript
useEffect(() => {
  // Clear velocity when entering viewing or planting states
  if (userState !== 'normal') {
    setVelocity(0);
  }
}, [userState]);
```

**Viewport Culling:**
```typescript
const visibleFlowers = useMemo(() => {
  // When viewing a flower, only show that flower
  if (userState === 'viewing' && selectedFlower) {
    return [selectedFlower];
  }

  const viewportWidth = window.innerWidth;
  const buffer = 300;

  return allFlowers.filter(flower => {
    const screenX = flower.x + offset;
    return screenX > -buffer && screenX < viewportWidth + buffer;
  });
}, [offset, allFlowers, userState, selectedFlower]);
```

**State Transitions:**
```typescript
const handleFlowerClick = (flower: Flower) => {
  setSelectedFlower(flower);
  setUserState('viewing');
  // Center the flower
  setOffset(window.innerWidth / 2 - flower.x);
};

const handleExitViewing = () => {
  setUserState('normal');
  setSelectedFlower(null);
};

const handleGardenClick = (e: React.PointerEvent) => {
  if (userState === 'viewing') {
    handleExitViewing();
    return;
  }

  if (userState === 'planting') {
    // Ignore clicks while planting
    return;
  }

  // Normal state - start planting
  const rect = e.currentTarget.getBoundingClientRect();
  const clickY = e.clientY - rect.top;
  const clickX = e.clientX - rect.left;

  if (clickY >= 0 && clickY <= rect.height) {
    const absoluteX = clickX - offset;
    setPlantingPosition({ x: absoluteX, y: clickY });
    setUserState('planting');
    // Center on planting position
    setOffset(window.innerWidth / 2 - absoluteX);
  }
};

const handleExitPlanting = () => {
  setUserState('normal');
  setPlantingPosition(null);
};
```

#### 3. Data Loading Strategy

**Initial Load:**
```typescript
useEffect(() => {
  fetch('/api/flowers/list')
    .then(res => res.json())
    .then(setAllFlowers);
}, []);
```

**URL Parameter Handling:**
- Check for `/flower/[slug]` route on load
- If present, fetch that specific flower and enter zoom state
- Center the flower in viewport

```typescript
useEffect(() => {
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments[1] === 'flower' && pathSegments[2]) {
    const slug = pathSegments[2];

    // Fetch flower by slug
    fetch(`/api/flowers/${slug}`)
      .then(res => res.json())
      .then(flower => {
        if (flower) {
          // Add to flowers list if not already present
          setAllFlowers(prev => {
            const exists = prev.some(f => f.id === flower.id);
            return exists ? prev : [...prev, flower];
          });

          // Zoom into shared flower
          handleFlowerClick(flower);
        }
      })
      .catch(console.error);
  }
}, []);
```

**Route Structure:**
- Normal view: `/`
- Shared flower: `/flower/[slug]` (e.g., `/flower/grateful-message`)

**Dynamic Route Setup:**

Create `app/flower/[slug]/page.tsx`:

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FLOWER_METADATA } from '@/lib/flower-data';
import GardenPage from '@/app/page'; // Import main garden page component

interface PageProps {
  params: { slug: string };
}

// Generate metadata for social sharing - uses Supabase directly
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: flower, error } = await supabase
    .from('flowers')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !flower) {
    return {
      title: 'Flower Not Found | Digigarden'
    };
  }

  const flowerMeta = FLOWER_METADATA[flower.flower];

  return {
    title: `${flower.title} | Digigarden`,
    description: flower.message,
    openGraph: {
      title: flower.title,
      description: flower.message,
      images: [flowerMeta.image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: flower.title,
      description: flower.message,
      images: [flowerMeta.image],
    }
  };
}

// Server component that renders the main garden page
export default function FlowerPage({ params }: PageProps) {
  // Client-side will detect the slug from URL and zoom to flower
  return <GardenPage />;
}
```

**Note:** The actual zoom/load logic happens client-side. This route ensures:
- Proper SSR for SEO
- Open Graph tags for social media previews (fetched via Supabase SDK)
- Friendly 404 handling

#### 4. Layout Structure

```tsx
import Image from 'next/image';

<div className="fixed inset-0 overflow-hidden">
  {/* Fixed Background - affixed to top, overflow hidden */}
  <Image
    src="/background.png"
    alt="Garden background"
    fill
    className="object-cover object-top"
    priority
  />

  {/* Clouds Layer */}
  <CloudsAnimation />

  {/* Instructions */}
  <div className="absolute top-4 left-4 text-white bg-black/50 p-4 rounded">
    Click on the grass to plant a flower with a positive message!
  </div>

  {/* Music Player */}
  <MusicPlayer />

  {/* Pannable Garden Container */}
  <div
    className="absolute bottom-0 w-full h-[60%] overflow-hidden"
    onClick={handleGardenClick}
    onPointerDown={userState === 'normal' ? handlePointerDown : undefined}
    onPointerMove={userState === 'normal' ? handlePointerMove : undefined}
    onPointerUp={userState === 'normal' ? handlePointerUp : undefined}
  >
    <div
      className="relative h-full cursor-shovel transition-all duration-500 ease-out"
      style={{
        transform: `translateX(${offset}px)`,
        willChange: 'transform'
      }}
    >
      <div
        className="transition-transform duration-500"
        style={{
          transform: userState === 'viewing' ? 'scale(2)' : 'scale(1)',
          transformOrigin: 'center'
        }}
      >
        {/* Dirt Plot Preview */}
        {plantingPosition && userState === 'planting' && (
          <DirtPlot
            x={plantingPosition.x}
            y={plantingPosition.y}
            visible={true}
          />
        )}

      {/* Flowers */}
      {visibleFlowers.map((flower, index) => (
        <div
          key={flower.id}
          className="absolute group"
          style={{ left: flower.x, top: flower.y }}
        >
          <Image
            src={FLOWER_METADATA[flower.flower].image}
            alt={flower.title}
            width={48}
            height={48}
            className={`cursor-pointer hover:scale-110 transition ${!isZoomed ? 'animate-sway' : 'w-24 h-24'}`}
            style={{
              animationDelay: !isZoomed ? `${(flower.x % 20) * 0.1}s` : '0s'
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${flower.title}`}
            onClick={(e) => {
              e.stopPropagation();
              handleFlowerClick(flower);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFlowerClick(flower);
              }
            }}
          />

          {/* Hover Preview Tooltip */}
          {userState === 'normal' && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg max-w-[200px] text-center">
                <p className="font-semibold">{flower.title}</p>
                <p className="text-xs mt-1 line-clamp-2">{flower.message}</p>
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90 mx-auto"></div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  </div>

  {/* Drawers & Modals */}
  <PlantingDrawer
    isOpen={userState === 'planting'}
    onClose={handleExitPlanting}
    clickPosition={plantingPosition}
    currentOffset={offset}
    onPlantSuccess={(flower) => {
      setAllFlowers(prev => [...prev, flower]);
      handleExitPlanting();
    }}
  />

  <FlowerDetailModal
    flower={selectedFlower}
    isOpen={userState === 'viewing'}
    onClose={handleExitViewing}
  />
</div>
```

#### 5. Clouds Animation Component

**File:** `components/clouds-animation.tsx`

Using SVG + CSS animations (simpler, no external dependencies):

```tsx
export default function CloudsAnimation() {
  const clouds = [
    { id: 1, top: '5%', delay: 0, duration: 60 },
    { id: 2, top: '15%', delay: 10, duration: 80 },
    { id: 3, top: '8%', delay: 20, duration: 70 },
    { id: 4, top: '20%', delay: 30, duration: 90 },
    { id: 5, top: '12%', delay: 5, duration: 75 },
    { id: 6, top: '18%', delay: 15, duration: 65 },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-[40%] overflow-hidden pointer-events-none">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            top: cloud.top,
            animationDelay: `${cloud.delay}s`,
            animationDuration: `${cloud.duration}s`,
          }}
        >
          <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
            <ellipse cx="30" cy="30" rx="25" ry="20" fill="white" fillOpacity="0.7" />
            <ellipse cx="60" cy="25" rx="35" ry="25" fill="white" fillOpacity="0.7" />
            <ellipse cx="90" cy="30" rx="30" ry="20" fill="white" fillOpacity="0.7" />
          </svg>
        </div>
      ))}
    </div>
  );
}
```

**Add to `app/globals.css`:**

```css
/* Cloud animation */
.cloud {
  position: absolute;
  animation: drift linear infinite;
  will-change: transform;
}

@keyframes drift {
  from {
    transform: translateX(-150px);
  }
  to {
    transform: translateX(calc(100vw + 150px));
  }
}
```

#### 6. Music Player Component

**File:** `components/music-player.tsx`

- Positioned top-right corner
- Play/Pause button (use lucide-react icons: Volume2, VolumeX)
- Audio element playing `/good-night-lofi-cozy-chill-music-160166.mp3`
- Default muted
- Loops continuously
- Persists state in localStorage (optional)

```typescript
const [isPlaying, setIsPlaying] = useState(false);
const audioRef = useRef<HTMLAudioElement>(null);

const toggleMusic = async () => {
  if (!audioRef.current) return;

  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
  } else {
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Autoplay blocked:', err);
      toast({
        title: "Cannot play music",
        description: "Browser blocked autoplay. Try clicking again after interacting with the page.",
        variant: "destructive",
      });
    }
  }
};

return (
  <div className="absolute top-4 right-4 z-50">
    <button
      onClick={toggleMusic}
      className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg"
    >
      {isPlaying ? <Volume2 /> : <VolumeX />}
    </button>

    <audio
      ref={audioRef}
      src="/good-night-lofi-cozy-chill-music-160166.mp3"
      loop
      muted={!isPlaying}
    />
  </div>
);
```

#### 7. Loading States & Error Handling

**Add loading state for initial data fetch:**
```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setIsLoading(true);
  fetch('/api/flowers/list')
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
```

**Handle shared flower loading with race condition prevention:**
```typescript
const [sharedFlowerLoading, setSharedFlowerLoading] = useState(false);

useEffect(() => {
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments[1] === 'flower' && pathSegments[2]) {
    const slug = pathSegments[2];
    setSharedFlowerLoading(true);

    fetch(`/api/flowers/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Flower not found');
        return res.json();
      })
      .then(flower => {
        // Wait for initial load to complete
        const checkLoaded = setInterval(() => {
          if (!isLoading) {
            clearInterval(checkLoaded);

            setAllFlowers(prev => {
              const exists = prev.some(f => f.id === flower.id);
              return exists ? prev : [...prev, flower];
            });

            handleFlowerClick(flower);
            setSharedFlowerLoading(false);
          }
        }, 100);
      })
      .catch(err => {
        console.error(err);
        setError('Shared flower not found');
        setSharedFlowerLoading(false);
      });
  }
}, [isLoading]); // Depend on isLoading to prevent race
```

**Loading UI:**
```tsx
{isLoading && (
  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
    <div className="text-center">
      <p className="text-lg">Loading garden...</p>
    </div>
  </div>
)}

{error && (
  <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
    {error}
  </div>
)}
```

#### 8. Image Optimization

**Use Next.js Image component for all flower images:**

```typescript
import Image from 'next/image';

// In flower rendering
<Image
  src={FLOWER_METADATA[flower.flower].image}
  alt={flower.title}
  width={48}
  height={48}
  priority={index < 10} // Prioritize first 10 visible flowers
  className="..."
/>
```

**Configure next.config.js for static image optimization:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp'],
  },
}

module.exports = nextConfig
```

**Benefits:**
- Automatic WebP conversion
- Lazy loading for off-screen flowers
- Responsive image sizing
- Optimized file sizes

#### 9. Performance Optimizations

**Separate zoom transforms for better performance:**

```typescript
// Instead of combining transforms in one div
<div
  className="relative h-full cursor-shovel transition-all duration-500"
  style={{
    transform: `translateX(${offset}px)`,
    willChange: 'transform'
  }}
>
  {/* Add zoom wrapper only when needed */}
  <div
    className="transition-transform duration-500"
    style={{
      transform: isZoomed ? 'scale(2)' : 'scale(1)',
      transformOrigin: 'center'
    }}
  >
    {/* Flowers here */}
  </div>
</div>
```

**Other optimizations:**
- Use `willChange: transform` for GPU acceleration
- Implement pointer events instead of mouse events
- Add `useCallback` for event handlers
- Memoize expensive calculations with `useMemo`
- Load all flowers on mount (adequate for MVP, optimize later if needed)

#### 10. Keyboard Navigation & Accessibility

**Keyboard shortcuts:**
- **Tab**: Navigate between visible flowers
- **Enter/Space**: Open flower detail when focused
- **Escape**: Close modals/drawers
- **Arrow keys**: Pan garden (optional stretch goal)

**Implementation:**
- Add `tabIndex={0}` to flower images
- Add `onKeyDown` handlers for Enter/Space
- Ensure focus visible styles (outline on keyboard focus)
- ARIA labels for screen readers

**Focus management:**
```typescript
// When zooming into flower, focus the modal
useEffect(() => {
  if (isZoomed && modalRef.current) {
    modalRef.current.focus();
  }
}, [isZoomed]);

// Trap focus within modal when open
// (shadcn Dialog handles this automatically)
```

#### 11. Desktop-Only Optimization

**Note:** This app is optimized for desktop only. Mobile support is not a priority for MVP.

- Viewport: Assume minimum 1024px width
- No touch-specific interactions needed
- Flower selector grid: 5 columns (no mobile breakpoint)
- Focus on desktop cursor interactions and keyboard navigation

---

## Shared Dependencies & Integration

### All Implementers Need:
- `types/flower.ts` (Implementer 1 creates, all use)
- `lib/flower-data.ts` (Implementer 1 creates, Implementers 2 & 3 use)

### Coordinate System (CRITICAL - All Implementers Must Follow):

**Layout Structure:**
- Fixed background image (100vh height)
- Sky area: Top 40% of viewport (not plantable)
- Grass area: Bottom 60% of viewport (plantable zone)

**Coordinate System:**
- **X-axis**: Infinite integer coordinates
  - Range: -∞ to +∞ (practically: -1000000 to +1000000)
  - Represents horizontal position in the infinite scrolling garden
  - 0 = initial center position
  - Negative values = left of center
  - Positive values = right of center

- **Y-axis**: Relative to grass container (0 at top of grass area)
  - Range: 0 to (grass container height in pixels)
  - With 60vh grass area, typically 0-400px range
  - 0 = top of grass (just below sky)
  - Max = bottom of grass area
  - **Only plantable within grass bounds**

**Click Validation:**
```typescript
// When user clicks on the garden container
const handleGardenClick = (e: React.PointerEvent) => {
  if (isZoomed) {
    handleZoomOut();
    return;
  }

  const rect = e.currentTarget.getBoundingClientRect();
  const clickY = e.clientY - rect.top; // Y relative to grass container
  const clickX = e.clientX - rect.left; // X relative to viewport

  // Only allow planting within grass area (user should only be able to click here anyway)
  if (clickY >= 0 && clickY <= rect.height) {
    const absoluteX = clickX - offset; // Convert to world coordinates

    setPlantingPosition({ x: absoluteX, y: clickY });
    setIsPlantingDrawerOpen(true);
  }
};
```

**Visual Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         SKY (40vh)              │ ← Not clickable/plantable
│      Fixed Background           │
│                                 │
├─────────────────────────────────┤
│                                 │
│       GRASS (60vh)              │ ← Plantable area
│   Infinite Horizontal Scroll    │ ← Y: 0 to ~400px
│   X: -∞ to +∞                   │ ← Flowers positioned here
│                                 │
└─────────────────────────────────┘
```

**Example Flower Coordinates:**
- Flower at center: `{ x: 0, y: 200 }`
- Flower 500px to the right, near top: `{ x: 500, y: 50 }`
- Flower 1000px to the left, near bottom: `{ x: -1000, y: 350 }`

### Integration Points:
1. **Implementer 1 → Implementer 2:** API endpoints and types
2. **Implementer 1 → Implementer 3:** API endpoints and flower metadata
3. **Implementer 2 → Implementer 3:** All UI components imported into main page
4. **Implementer 3 coordinates:** Main page uses components from 2, calls APIs from 1

---

## Assets Checklist (Already in `/public`)
- ✅ `red-tulip.png`
- ✅ `yellow-sunflower.png`
- ✅ `blue-forget-me-not.png`
- ✅ `white-rose.png`
- ✅ `pink-carnation.png`
- ✅ `shovel.png`
- ✅ `dirt-plot.png` (standardized filename)
- ✅ `background.png`
- ✅ `good-night-lofi-cozy-chill-music-160166.mp3`

---



## Deployment Checklist (Vercel)
- [ ] Set environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` (your production URL for Open Graph)
- [ ] Verify `/public` assets are included in build
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Test sharing URLs work with Open Graph preview (use https://www.opengraph.xyz/)
- [ ] Verify social media previews (Twitter Card Validator, Facebook Debugger)
- [ ] Set up custom domain (optional)

---

## Stretch Goals (Post-MVP)
1. Add wild turkey/bunny animations walking across field
2. Implement multi-color selection for single flower base
3. Add chat feature
4. Create opening animation (Gamecube-style)
5. Add interaction sounds (plant, click, etc.)
6. Add flower growth animation after planting
7. Content moderation and profanity filtering
8. Rate limiting on flower creation
9. Mobile responsive design
