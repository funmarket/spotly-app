
'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useDevapp } from '@/hooks/use-devapp';
import { collection, query, where, orderBy, getDoc, doc, limit } from 'firebase/firestore';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useMemoFirebase, useDoc } from '@/firebase';

function Feed() {
  const { firestore, userWallet } = useDevapp();
  
  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('music');
  
  const userDocRef = useMemoFirebase(() => {
    if (!userWallet || !firestore) return null;
    return doc(firestore, 'users', userWallet);
  }, [userWallet, firestore]);

  const { data: currentUser, isLoading: isLoadingUser } = useDoc<User>(userDocRef);


  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    const videosCollection = collection(firestore, 'videos');
    
    if (activeFeedTab === 'rising') {
       return query(videosCollection, orderBy('rankingScore', 'desc'), limit(50));
    }
    
    // Simplified query: Only sort by creation date. Filtering will be done client-side.
    return query(videosCollection, orderBy('createdAt', 'desc'), limit(200));

  }, [firestore, activeFeedTab]);

  const { data: videos, isLoading: areVideosLoading } = useCollection<Video & { id: string }>(videosQuery);
  
  useEffect(() => {
    const enrichVideos = async () => {
      if (!videos || !firestore) {
        if (!areVideosLoading) setIsEnriching(false);
        return;
      }
      
      setIsEnriching(true);
      
      const userCache = new Map<string, User>();

      // Client-side filtering
      const filteredVideos = activeFeedTab === 'rising' 
        ? videos 
        : videos.filter(v => v.videoCategory === activeFeedTab);

      const enriched = await Promise.all(
        filteredVideos
        .filter(v => v.status === 'active' && !v.isBanned && !v.hiddenFromFeed)
        .map(async (video) => {
          let artist: User | undefined = userCache.get(video.artistId);
          if (!artist) {
            const userRef = doc(firestore, 'users', video.artistId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              artist = { userId: userSnap.id, ...userSnap.data() } as User;
              userCache.set(video.artistId, artist);
            }
          }
          
          if (!artist || artist.isBanned || artist.isDeleted) {
             return null;
          }
          return { ...video, user: artist } as EnrichedVideo;
        })
      );
      
      setEnrichedVideos(enriched.filter(v => v !== null) as EnrichedVideo[]);
      setIsEnriching(false);
    };

    enrichVideos();
  }, [videos, firestore, areVideosLoading, activeFeedTab]);

  const isLoading = isLoadingUser || areVideosLoading || isEnriching;

  if (isLoading && enrichedVideos.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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


export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <Feed />;
}
