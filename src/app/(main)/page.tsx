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
  const { firestore, user, isUserLoading } = useFirebase();
  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('music');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    const videosCollection = collection(firestore, 'videos');
    let q = query(videosCollection, where('status', '==', 'active'), where('isBanned', '==', false), where('hiddenFromFeed', '==', false));

    if (activeFeedTab === 'rising') {
      return query(q, orderBy('rankingScore', 'desc'), limit(50));
    } else {
      return query(q, where('videoCategory', '==', activeFeedTab), orderBy('createdAt', 'desc'), limit(50));
    }
  }, [firestore, activeFeedTab]);

  const { data: videos, isLoading: areVideosLoading } = useCollection<Video & { id: string }>(videosQuery);
  
  useEffect(() => {
    if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setCurrentUser({ userId: docSnap.id, ...docSnap.data() } as User);
            }
        });
    } else {
        setCurrentUser(null);
    }
  }, [user, firestore]);

  useEffect(() => {
    const enrichVideos = async () => {
      if (!videos || !firestore) {
        if (!areVideosLoading) setIsEnriching(false);
        return;
      }
      
      setIsEnriching(true);
      
      const userCache = new Map<string, User>();

      const enriched = await Promise.all(
        videos.map(async (video) => {
          let artist: User | undefined = userCache.get(video.artistId);
          if (!artist) {
            const userRef = doc(firestore, 'users', video.artistId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              artist = { userId: userSnap.id, ...userSnap.data() } as User;
              userCache.set(video.artistId, artist);
            }
          }
          
          if (!artist) {
             artist = {
                userId: 'unknown',
                walletAddress: 'unknown',
                username: 'Unknown Artist',
                profilePhotoUrl: '',
                bannerPhotoUrl: '',
                bio: '',
                role: 'fan',
             };
          }
          return { ...video, user: artist } as EnrichedVideo;
        })
      );
      
      setEnrichedVideos(enriched);
      setIsEnriching(false);
    };

    enrichVideos();
  }, [videos, firestore, areVideosLoading]);

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
      currentUser={currentUser}
    />
  );
}
