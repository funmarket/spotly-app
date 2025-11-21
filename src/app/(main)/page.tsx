
'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useDevapp } from '@/hooks/use-devapp';
import { collection, query, where, orderBy, getDoc, doc, limit } from 'firebase/firestore';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useMemoFirebase } from '@/firebase';

function Feed() {
  const { firestore, userWallet } = useDevapp();
  const router = useRouter();

  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('music');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    setIsLoadingUser(true);
    if (userWallet && firestore) {
      const userDocRef = doc(firestore, 'users', userWallet);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
           setCurrentUser({ userId: docSnap.id, ...docSnap.data() } as User);
        } else {
            // AuthHandler should create a minimal profile, but handle case where it might not exist yet
            setCurrentUser(null);
        }
        setIsLoadingUser(false);
      }).catch(() => setIsLoadingUser(false));
    } else {
      // No authenticated user, treat as guest.
      setCurrentUser(null);
      setIsLoadingUser(false);
    }
  }, [userWallet, firestore, router]);


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
