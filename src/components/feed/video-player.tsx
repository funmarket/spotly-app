'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';

type VideoPlayerProps = {
  /** Full YouTube watch URL or share URL */
  videoUrl: string;
  /** Is this the currently active video in the feed? */
  isActive: boolean;
};

declare global {
  interface Window {
    __audioUnlocked?: boolean;
  }
}

/**
 * Helper: turn a YouTube URL into a JS-API-enabled embed URL.
 * Ensures: autoplay=1, mute=1, playsinline=1, enablejsapi=1 etc.
 */
function makeYoutubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());

    let videoId = '';
    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.replace('/', '');
    } else if (
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('www.youtube.com')
    ) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.replace('/embed/', '');
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.replace('/shorts/', '');
      }
    }

    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      playsinline: '1',
      enablejsapi: '1',
      rel: '0',
      controls: '0',
      modestbranding: '1',
      // IMPORTANT for postMessage control:
      origin: window.location.origin,
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return null;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, isActive }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isApiReady, setIsApiReady] = useState(false);

  // Build embed URL whenever the video changes
  useEffect(() => {
    setEmbedUrl(makeYoutubeEmbedUrl(videoUrl));
    setIsMuted(true);
    setIsApiReady(false);
  }, [videoUrl]);

  // Called when iframe fires onLoad – we consider API ready after a short delay
  const handleIframeLoad = useCallback(() => {
    // give the iframe a tiny moment to bootstrap the player
    setTimeout(() => setIsApiReady(true), 200);
  }, []);

  const sendCommand = useCallback((func: string, args: any[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  }, []);

  /**
   * Core playback effect:
   * - When this card is active AND API is ready → play
   * - When inactive → pause
   * - If window.__audioUnlocked is true, auto-unmute after 500ms
   */
  useEffect(() => {
    if (!isApiReady) return;

    if (isActive) {
      // always start muted + playing
      sendCommand('mute');
      sendCommand('playVideo');

      if (typeof window !== 'undefined' && window.__audioUnlocked) {
        setTimeout(() => {
          sendCommand('unMute');
          setIsMuted(false);
        }, 500);
      } else {
        setIsMuted(true);
      }
    } else {
      // not active → pause & mute
      sendCommand('pauseVideo');
      sendCommand('mute');
      setIsMuted(true);
    }
  }, [isActive, isApiReady, sendCommand]);

  const handleTapToUnmute = useCallback(() => {
    sendCommand('unMute');
    if (typeof window !== 'undefined') {
      window.__audioUnlocked = true; // unlock future auto-unmute
    }
    setIsMuted(false);
  }, [sendCommand]);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm text-neutral-400">
        Invalid video URL
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title="SPOTLY Video"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={handleIframeLoad}
      />

      {/* Tap-to-unmute overlay */}
      {isActive && isMuted && (
        <button
          type="button"
          onClick={handleTapToUnmute}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 border border-white/40 text-white text-sm shadow-lg"
        >
          🔇 Tap to unmute
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
