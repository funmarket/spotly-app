'use client';
import { useDevapp } from '@/hooks/use-devapp';
import { useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2 } from 'lucide-react';
import type { Favorite, Video, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

interface EnrichedFavorite extends Favorite {
  item: Video & { user: User | null } | null;
}

const FavoriteVideoCard = ({ video }: { video: Video }) => {
  return (
    <Link href="#" className="group">
      <Card className="overflow-hidden">
        <div className="aspect-w-9 aspect-h-16 relative">
          <Image
            src={`https://picsum.photos/seed/${video.videoId}/300/500`}
            alt={video.description}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="video thumbnail"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <CardFooter className="p-2">
          <p className="text-xs text-muted-foreground truncate">{video.description}</p>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default function FavoritesPage() {
  const { userWallet, firestore } = useDevapp();
  const [enrichedFavorites, setEnrichedFavorites] = useState<EnrichedFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const favoritesQuery = useMemoFirebase(() => {
    if (!firestore || !userWallet) return null;
    return query(
      collection(firestore, 'favorites'),
      where('userId', '==', userWallet),
      where('itemType', '==', 'video')
    );
  }, [firestore, userWallet]);

  const { data: favorites } = useCollection<Favorite>(favoritesQuery);

  useEffect(() => {
    const enrichFavorites = async () => {
      if (!favorites || !firestore) {
         if(userWallet === undefined) setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const enriched = await Promise.all(
        favorites.map(async (fav) => {
          if (fav.itemType === 'video') {
            const videoRef = doc(firestore, 'videos', fav.itemId);
            const videoSnap = await getDocs(query(collection(firestore, 'videos'), where('__name__', '==', fav.itemId)));
            if (!videoSnap.empty) {
               const videoData = { id: videoSnap.docs[0].id, ...videoSnap.docs[0].data() } as Video & {id: string};
              
              const userRef = doc(firestore, 'users', videoData.artistId);
               const userSnap = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', videoData.artistId)));

              const artist = !userSnap.empty ? { userId: userSnap.docs[0].id, ...userSnap.docs[0].data() } as User : null;

              return { ...fav, item: { ...videoData, videoId: videoData.id, user: artist } };
            }
          }
          return { ...fav, item: null };
        })
      );
      setEnrichedFavorites(enriched.filter(ef => ef.item) as EnrichedFavorite[]);
      setIsLoading(false);
    };

    enrichFavorites();
  }, [favorites, firestore, userWallet]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-headline flex items-center gap-2 mb-6">
          <Heart /> My Favorites
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
             <Card key={i}>
                <Skeleton className="aspect-[9/16] w-full" />
                <CardFooter className="p-2">
                  <Skeleton className="h-4 w-3/4" />
                </CardFooter>
              </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!userWallet) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Card className="w-[350px] text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Favorites</CardTitle>
            <CardDescription>Log in to see your favorite videos and products.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const favoriteVideos = enrichedFavorites.filter(
    (fav) => fav.itemType === 'video' && fav.item
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-headline flex items-center gap-2 mb-6">
        <Heart /> My Favorites
      </h1>

      {favoriteVideos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteVideos.map((fav) => (
             fav.item && <FavoriteVideoCard key={fav.id} video={fav.item as Video} />
          ))}
        </div>
      ) : (
        <Card className="w-full text-center mt-8">
          <CardHeader>
              <div className="mx-auto bg-muted p-3 rounded-full mb-4 w-fit">
                  <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="font-headline">No Favorites Yet</CardTitle>
              <CardDescription>Tap the bookmark icon on a video to save it here.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
