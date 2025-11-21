'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDoc, doc, limit } from 'firebase/firestore';
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
  const [activeFeedTab, setActiveFeedTab] = useState('music'); // music, acting, creator, rising

  const videosQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    
    // Base query
    const videosCollection = collection(firestore, 'videos');
    
    // Common filters
    let q = query(videosCollection, where('status', '==', 'active'), where('isBanned', '==', false), where('hiddenFromFeed', '==', false));

    if (activeFeedTab === 'rising') {
      // For 'rising', we sort by rankingScore
      return query(q, orderBy('rankingScore', 'desc'), limit(50));
    } else {
      // For categories, we filter by category and sort by creation date
      return query(q, where('videoCategory', '==', activeFeedTab), orderBy('createdAt', 'desc'), limit(50));
    }
  }, [firestore, isUserLoading, activeFeedTab]);

  const { data: videos, isLoading: areVideosLoading } = useCollection<Video & { id: string }>(videosQuery);

  useEffect(() => {
    const enrichVideos = async () => {
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

  const isLoading = isUserLoading || areVideosLoading || isEnriching;

  if (isLoading && enrichedVideos.length === 0) {
    return <HomeSkeleton />;
  }

  return (
    <VideoFeed 
      videos={enrichedVideos} 
      activeFeedTab={activeFeedTab}
      setActiveFeedTab={setActiveFeedTab}
      isLoading={isLoading}
    />
  );
}
