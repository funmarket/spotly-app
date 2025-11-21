'use client';
import { useEffect, useState, useMemo } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDoc, doc, limit } from 'firebase/firestore';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase/firestore/use-collection';

function Feed() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('music');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
           setCurrentUser({ userId: docSnap.id, ...docSnap.data() } as User);
        } else {
            // User is authenticated but has no profile, redirect to onboarding.
            router.push('/onboarding');
        }
      });
    } else {
      setCurrentUser(null);
    }
  }, [user, isUserLoading, firestore, router]);


  const videosQuery = useMemo(() => {
    if (!firestore) return null;
    
    const videosCollection = collection(firestore, 'videos');
    
    if (activeFeedTab === 'rising') {
       return query(videosCollection, orderBy('rankingScore', 'desc'), limit(50));
    } else {
       return query(videosCollection, where('videoCategory', '==', activeFeedTab), orderBy('createdAt', 'desc'), limit(50));
    }
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

      const enriched = await Promise.all(
        videos
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
  }, [videos, firestore, areVideosLoading]);

  const isLoading = isUserLoading || areVideosLoading || isEnriching;

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
