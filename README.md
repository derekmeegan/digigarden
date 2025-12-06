# DigiGarden

A digital garden for planting and sharing positive messages.

## What is this?

DigiGarden is a communal space where people can plant virtual flowers, each carrying a message of kindness, encouragement, or hope. Click anywhere on the garden to plant a flower, write your message, and watch it join the others in an ever-growing field.

This isn't a product. There are no accounts, no metrics, no engagement hooks. Just a quiet corner of the internet where people leave notes for strangers.

## Features

- **Plant flowers** — Choose from tulips, roses, sunflowers, carnations, forget-me-nots, and lilies
- **Share messages** — Each flower holds a title, message, and optional author name
- **Browse the garden** — Scroll through an infinite horizontal garden to discover what others have planted
- **Share individual flowers** — Every flower has its own URL for sharing on social media
- **Ambient experience** — Lofi music, drifting clouds, a blinking sun, and gently swaying flowers

## Tech Stack

- **Framework**: Next.js 16 / React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Database**: Supabase
- **Notifications**: Sonner

## Running Locally

```bash
npm install
npm run dev
```

Create a `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Philosophy

The internet has enough apps designed to capture attention and extract value. DigiGarden is intentionally simple — a place to give rather than take. Plant something kind and move on, or stay a while and read what others have shared.

No ads. No data harvesting. No growth hacking. Just flowers.
