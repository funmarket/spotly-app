'use client';

import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';

type VideoPlayerProps = {
  src: string;
  isPlaying: boolean;
};

export function VideoPlayer({ src, isPlaying }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = !!(window as any).__audioUnlocked;
      if (unlocked) {
        setIsAudioUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.play().catch((e) => {
        // Autoplay was prevented. This can happen if the user hasn't interacted with the page yet.
        // We'll rely on the user to manually unmute/play.
      });

      if (isAudioUnlocked && videoElement.muted) {
        const timer = setTimeout(() => {
          setIsMuted(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      videoElement.pause();
      if (!videoElement.muted) {
        setIsMuted(true);
      }
    }
  }, [isPlaying, isAudioUnlocked]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted && typeof window !== 'undefined' && !(window as any).__audioUnlocked) {
      (window as any).__audioUnlocked = true;
      setIsAudioUnlocked(true);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative h-full w-full" onClick={handleToggleMute}>
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        className="h-full w-full object-cover"
        muted={isMuted}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="h-20 w-20 text-white/70"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-12 w-12" />
          ) : (
            <Volume2 className="h-12 w-12" />
          )}
        </Button>
      </div>
      {isMuted && !isPlaying && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
          Tap to unmute
        </div>
      )}
    </div>
  );
}
