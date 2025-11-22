'use client';

/**
 * Parses a YouTube video URL or embed code to extract the video ID and construct a standardized embed URL.
 * @param input The raw string from the user, which can be a URL or an iframe embed code.
 * @returns An object with the video type, ID, and the clean embed URL, or an error message.
 */
export const parseVideoUrl = (input: string) => {
  if (!input || typeof input !== 'string') {
    return { type: 'unknown', error: 'Video URL is missing or invalid.' };
  }

  const sanitizedInput = input.trim();

  // Regex for extracting video ID from various YouTube URL formats
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  // Check for iframe embed code first
  const iframeMatch = sanitizedInput.match(/<iframe.*src="([^"]+)"/);
  const urlToParse = iframeMatch ? iframeMatch[1] : sanitizedInput;

  for (const pattern of ytPatterns) {
    const match = urlToParse.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0`;
      return { type: 'youtube', id: videoId, embedUrl, error: null };
    }
  }

  // Add other video platforms here if needed in the future

  return { type: 'unknown', error: 'Invalid video link. Please use a valid YouTube link or embed code.' };
};
