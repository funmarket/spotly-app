'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton = () => (
  <div className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
    <Skeleton className="h-full w-full" />
  </div>
);

export default function HomePage() {
  const { firestore, isUserLoading } = useFirebase();
  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);

  // The query no longer needs to wait for `isUserLoading` because the parent
  // provider now handles the auth-gating.
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'videos'),
      where('status', '==', 'active'),
      where('isBanned', '==', false),
      where('hiddenFromFeed', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: videos, isLoading: areVideosLoading } = useCollection<Video & { id: string }>(videosQuery);

  useEffect(() => {
    const enrichVideos = async () => {
      if (!videos || !firestore) {
        if (!areVideosLoading) setIsEnriching(false);
        return;
      }
      
      setIsEnriching(true);
      
      const enriched = await Promise.all(
        videos.map(async (video) => {
          const userRef = doc(firestore, 'users', video.artistId);
          const userSnap = await getDoc(userRef);
          
          let user: User;
          if (userSnap.exists()) {
             user = { userId: userSnap.id, ...userSnap.data() } as User;
          } else {
             user = {
                userId: 'unknown',
                walletAddress: 'unknown',
                username: 'Unknown Artist',
                profilePhotoUrl: '',
                bannerPhotoUrl: '',
                bio: '',
                role: 'fan',
             };
          }
          return { ...video, user } as EnrichedVideo;
        })
      );
      
      setEnrichedVideos(enriched);
      setIsEnriching(false);
    };

    enrichVideos();
  }, [videos, firestore, areVideosLoading]);

  // The combined loading state is now simpler. We just wait for video fetching & enriching.
  const isLoading = areVideosLoading || isEnriching;

  if (isLoading) {
    return (
       <div className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  return <VideoFeed videos={enrichedVideos} />;
}
