'use client';

import { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

export function MusicPlayer() {
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
        toast.error('Cannot play music', {
          description: 'Browser blocked autoplay. Try clicking again after interacting with the page.',
        });
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={toggleMusic}
        className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        aria-label={isPlaying ? 'Mute music' : 'Play music'}
      >
        {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>

      <audio
        ref={audioRef}
        src="/good-night-lofi-cozy-chill-music-160166.mp3"
        loop
      />
    </div>
  );
}
