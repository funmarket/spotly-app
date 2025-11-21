import { VideoFeed } from '@/components/feed/video-feed';
import { getVideos, getUsers } from '@/lib/data';
import type { EnrichedVideo } from '@/lib/types';

export default function HomePage() {
  const videos = getVideos();
  const users = getUsers();

  const videosWithUsers: EnrichedVideo[] = videos.map(video => {
    const user = users.find(u => u.walletAddress === video.artistId);
    if (!user) {
      // In a real app, you might want to handle this case differently,
      // like filtering out videos with no user or showing a placeholder.
      return {
        ...video,
        user: { 
          userId: 'unknown', 
          walletAddress: 'unknown', 
          username: 'Unknown Artist',
          profilePhotoUrl: '',
          bannerPhotoUrl: '',
          bio: '',
          role: 'fan'
        },
      };
    }
    return { ...video, user };
  }).filter(v => v !== null) as EnrichedVideo[];

  return <VideoFeed videos={videosWithUsers} />;
}
