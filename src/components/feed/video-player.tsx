'use client';

import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

type VideoPlayerProps = {
  src: string;
  isPlaying: boolean;
};

export function VideoPlayer({ src, isPlaying }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isApiReady, setIsApiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to post messages to the YouTube iframe
  const postMessageToPlayer = (func: string, args?: any) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: func,
        args: args || [],
      }),
      '*'
    );
  };

  useEffect(() => {
    // Reset state when src changes
    setIsApiReady(false);
    setError(null);
    setIsMuted(true);
    
    const handlePlayerStateChange = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange') {
          if (data.info === -1) { // unstarted
             setError(null);
          }
          if (data.info === 0) { // ended
            postMessageToPlayer('playVideo');
          }
        }
        if (data.event === 'onReady') {
           setIsApiReady(true);
           setError(null);
        }
        if (data.event === 'onError') {
           setError(`Video unavailable. Error code: ${data.info}`);
        }
      } catch (e) {
        // Not a JSON message from our player, ignore
      }
    };
    
    window.addEventListener('message', handlePlayerStateChange);

    return () => {
      window.removeEventListener('message', handlePlayerStateChange);
    };

  }, [src]);

  useEffect(() => {
    if (!isApiReady) return;

    if (isPlaying) {
      postMessageToPlayer('playVideo');
      // Unmute only if user has interacted before
      if ((window as any).__audioUnlocked) {
        setTimeout(() => {
            postMessageToPlayer('unMute');
            setIsMuted(false);
        }, 500);
      } else {
        postMessageToPlayer('mute');
        setIsMuted(true);
      }
    } else {
      postMessageToPlayer('pauseVideo');
    }
  }, [isPlaying, isApiReady]);

  useEffect(() => {
    if (!isApiReady) return;
    if (isMuted) {
      postMessageToPlayer('mute');
    } else {
      postMessageToPlayer('unMute');
    }
  }, [isMuted, isApiReady]);


  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted && typeof window !== 'undefined' && !(window as any).__audioUnlocked) {
      (window as any).__audioUnlocked = true;
    }
    setIsMuted(!isMuted);
  };
  
  const showLoading = !isApiReady && !error;

  return (
    <div className="relative h-full w-full bg-black" onClick={handleToggleMute}>
      <iframe
        ref={iframeRef}
        src={src}
        className={`w-full h-full object-cover transition-opacity duration-300 ${showLoading || error ? 'opacity-0' : 'opacity-100'}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="SPOTLY Video"
      />
      
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      )}
      
      {error && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-lg font-semibold">Video Unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!showLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 text-white/70"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-12 w-12 drop-shadow-lg" />
            ) : (
              <Volume2 className="h-12 w-12 drop-shadow-lg" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
