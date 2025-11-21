'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton = () => (
  <div className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
    <Skeleton className="h-full w-full" />
  </div>
);


export default function HomePage() {
  const firestore = useFirestore();
  const [videos, setVideos] = useState<EnrichedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!firestore) return;

      setLoading(true);
      try {
        const videosQuery = query(
          collection(firestore, 'videos'),
          where('status', '==', 'active'),
          where('isBanned', '==', false),
          where('hiddenFromFeed', '==', false),
          orderBy('createdAt', 'desc')
        );

        const videoSnapshot = await getDocs(videosQuery);
        const videosData = videoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video & { id: string }));

        const enrichedVideos: EnrichedVideo[] = await Promise.all(
          videosData.map(async (video) => {
            const userRef = doc(firestore, 'users', video.artistId);
            const userSnap = await getDoc(userRef);
            const user = userSnap.exists() ? ({ userId: userSnap.id, ...userSnap.data() } as User) : null;

            if (!user) {
              // This can be changed to a default user or filtered out
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
              } as EnrichedVideo;
            }
            return { ...video, user } as EnrichedVideo;
          })
        );
        
        setVideos(enrichedVideos.filter(v => v !== null));

      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [firestore]);


  if (loading) {
    return (
       <div className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  return <VideoFeed videos={videos} />;
}
    