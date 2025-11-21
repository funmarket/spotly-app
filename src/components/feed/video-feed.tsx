'use client';
import type { EnrichedVideo } from '@/lib/types';
import { VideoCard } from './video-card';

type VideoFeedProps = {
  videos: EnrichedVideo[];
};

export function VideoFeed({ videos }: VideoFeedProps) {
  return (
    <div className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}
