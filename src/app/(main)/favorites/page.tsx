
'use client';
import { useDevapp } from '@/hooks/use-devapp';
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
            src={`https://picsum.photos/seed/${video.id}/300/500`}
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
  const { userWallet, supabase } = useDevapp();
  const [enrichedFavorites, setEnrichedFavorites] = useState<EnrichedFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const enrichFavorites = async () => {
      if (!userWallet) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userWallet)
        .eq('item_type', 'video');

      if (favError || !favorites) {
        console.error('Error fetching favorites:', favError);
        setIsLoading(false);
        return;
      }

      const videoIds = favorites.map(fav => fav.item_id);
      if (videoIds.length === 0) {
        setEnrichedFavorites([]);
        setIsLoading(false);
        return;
      }

      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*, users(*)')
        .in('id', videoIds);

      if (videosError) {
        console.error('Error fetching favorite videos:', videosError);
        setIsLoading(false);
        return;
      }
      
      const videosMap = new Map(videos.map(v => [v.id, v]));

      const enriched = favorites.map(fav => {
        const videoData = videosMap.get(fav.item_id);
        if (videoData) {
            const user = videoData.users ? {
                userId: videoData.users.user_id,
                walletAddress: videoData.users.wallet_address,
                username: videoData.users.username,
                profilePhotoUrl: videoData.users.profile_photo_url,
                bannerPhotoUrl: videoData.users.banner_photo_url,
                bio: videoData.users.bio,
                role: videoData.users.role,
            } : null;

            const item: Video & { user: User | null } = {
                id: videoData.id,
                videoId: videoData.id,
                artistId: videoData.artist_id,
                videoUrl: videoData.video_url,
                description: videoData.description,
                topCount: videoData.top_count,
                flopCount: videoData.flop_count,
                shareCount: videoData.share_count,
                commentCount: videoData.comment_count,
                status: videoData.status,
                isBanned: videoData.is_banned,
                bookCount: videoData.book_count,
                adoptCount: videoData.adopt_count,
                rankingScore: videoData.ranking_score,
                rawVideoInput: videoData.raw_video_input,
                videoCategory: videoData.video_category,
                hiddenFromFeed: videoData.hidden_from_feed,
                createdAt: { seconds: new Date(videoData.created_at).getTime() / 1000, nanoseconds: 0 },
                user: user,
            };
            return { ...fav, id: fav.id, item };
        }
        return { ...fav, id: fav.id, item: null };
      });
      
      setEnrichedFavorites(enriched.filter(ef => ef.item) as EnrichedFavorite[]);
      setIsLoading(false);
    };

    enrichFavorites();
  }, [supabase, userWallet]);

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
