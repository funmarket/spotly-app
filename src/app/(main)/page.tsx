'use client';
import { useEffect, useState } from 'react';
import { VideoFeed } from '@/components/feed/video-feed';
import { useDevapp } from '@/hooks/use-devapp';
import type { EnrichedVideo, User, Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper to convert Supabase video/user to our app's type
// Note: This is a temporary measure. We should align types more closely long-term.
const formatVideo = (video: any, user: any): EnrichedVideo | null => {
  if (!video || !user) return null;
  return {
    id: video.id,
    artistId: video.artist_id,
    videoUrl: video.video_url,
    description: video.description,
    topCount: video.top_count,
    flopCount: video.flop_count,
    shareCount: video.share_count,
    commentCount: video.comment_count,
    status: video.status,
    isBanned: video.is_banned,
    bookCount: video.book_count,
    adoptCount: video.adopt_count,
    rankingScore: video.ranking_score,
    rawVideoInput: video.raw_video_input,
    videoCategory: video.video_category,
    hiddenFromFeed: video.hidden_from_feed,
    createdAt: { seconds: new Date(video.created_at).getTime() / 1000, nanoseconds: 0 },
    user: formatUser(user),
  };
};

const formatUser = (user: any): User | null => {
    if(!user) return null;
    return {
        userId: user.user_id,
        walletAddress: user.wallet_address,
        username: user.username,
        profilePhotoUrl: user.profile_photo_url,
        bannerPhotoUrl: user.banner_photo_url,
        bio: user.bio,
        role: user.role,
        // other fields can be added as needed
    }
}


function Feed() {
  const { supabase, user: authUser, userWallet } = useDevapp();
  
  const [enrichedVideos, setEnrichedVideos] = useState<EnrichedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeedTab, setActiveFeedTab] = useState('music');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (userWallet) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', userWallet)
          .single();
        if (data) {
          setCurrentUser(formatUser(data));
        }
      }
    };
    fetchCurrentUser();
  }, [userWallet, supabase]);


  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);

      let query = supabase
        .from('videos')
        .select(`
            *,
            users ( * )
        `)
        .eq('status', 'active')
        .eq('is_banned', false)
        .eq('hidden_from_feed', false)
        .limit(50);
      
      if (activeFeedTab === 'rising') {
        query = query.order('ranking_score', { ascending: false });
      } else {
        query = query.eq('video_category', activeFeedTab).order('created_at', { ascending: false });
      }
      
      const { data: videosData, error } = await query;

      if (error) {
        console.error("Error fetching videos:", error);
        setEnrichedVideos([]);
      } else if (videosData) {
        const enriched = videosData
            .map(video => formatVideo(video, video.users))
            .filter(v => v !== null) as EnrichedVideo[];
        setEnrichedVideos(enriched);
      }
      
      setIsLoading(false);
    };

    fetchVideos();
  }, [supabase, activeFeedTab]);

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

    