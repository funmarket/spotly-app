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

const HomeSkeleton = () => (
    <div className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
    </div>
);


export default function HomePage() {
  const { firestore, isUserLoading } = useFirebase();
  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);

  // The query will be null until Firebase has resolved its auth state.
  const videosQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'videos'),
      where('status', '==', 'active'),
      where('isBanned', '==', false),
      where('hiddenFromFeed', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, isUserLoading]);

  const { data: videos, isLoading: areVideosLoading } = useCollection<Video & { id: string }>(videosQuery);

  useEffect(() => {
    const enrichVideos = async () => {
      // Don't enrich if there are no videos or if the initial query is still loading.
      if (!videos || !firestore) {
        if (!areVideosLoading && !isUserLoading) setIsEnriching(false);
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
  }, [videos, firestore, areVideosLoading, isUserLoading]);

  // Combined loading state is now robust.
  // We wait for auth, then for the video query, then for enrichment.
  const isLoading = isUserLoading || areVideosLoading || isEnriching;

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return <VideoFeed videos={enrichedVideos} />;
}
