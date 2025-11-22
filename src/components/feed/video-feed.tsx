
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { EnrichedVideo, User, Favorite } from '@/lib/types';
import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { Search, Bell, Home, Compass, Upload, MessageCircle, User as UserIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDevapp } from '@/hooks/use-devapp';
import { useToast } from '@/hooks/use-toast';

function TopCategoryMenu({ activeFeedTab, setActiveFeedTab }: { activeFeedTab: string, setActiveFeedTab: (tab: string) => void }) {
  const { user: authUser, supabase } = useDevapp();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (authUser) {
      const fetchNotifications = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', authUser.id)
          .eq('read', false);
        setUnreadCount(count || 0);
      };
      fetchNotifications();

      const channel = supabase.channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${authUser.id}` }, 
        (payload) => {
            fetchNotifications();
        })
        .subscribe();

       return () => {
           supabase.removeChannel(channel);
       }
    }
  }, [authUser, supabase]);
  

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "music": return "Music";
      case "acting": return "Acting";
      case "creator": return "Creator";
      case "rising": return "Rising Stars";
      default: return "";
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-14">
      <div className="container mx-auto h-full flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
        <div className="text-xl font-bold text-white font-headline">SPOTLY</div>
         <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {["music", "acting", "creator", "rising"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFeedTab(cat)}
              className={`px-2.5 py-1.5 rounded-full font-bold whitespace-nowrap text-xs sm:text-sm transition-all flex items-center justify-center min-h-[32px] ${activeFeedTab === cat ? 'bg-primary text-primary-foreground' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              {getTabLabel(cat)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" onClick={() => router.push('/discover')} className="text-white/80 hover:text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')} className="text-white/80 hover:text-white hover:bg-white/10 relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                 <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                 </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


const BottomNavBar = () => {
    const { userWallet } = useDevapp();
    const pathname = usePathname();

    const navItems = [
      { href: '/', label: 'Home', icon: Home },
      { href: '/discover', label: 'Discover', icon: Compass },
      { href: '/submit-video', label: 'Upload', icon: Upload },
      { href: '/gossip', label: 'Inbox', icon: MessageCircle },
      { href: '/profile', label: 'Profile', icon: UserIcon },
    ];

    const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType; }) => {
        const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
        let finalHref = href;
        if (label === 'Profile') {
            finalHref = userWallet ? `/profile/${userWallet}` : '/onboarding';
        }

        return (
            <Link
                href={finalHref}
                className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            </Link>
        );
    };
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border z-50">
            <div className="container mx-auto h-full">
                <div className="grid h-full grid-cols-5 items-center">
                    {navItems.map(item => <NavItem key={item.label} {...item} />)}
                </div>
            </div>
        </nav>
    );
};

export function VideoFeed({ videos, activeFeedTab, setActiveFeedTab, isLoading, currentUser }: { videos: EnrichedVideo[], activeFeedTab: string, setActiveFeedTab: (tab: string) => void, isLoading: boolean, currentUser: User | null }) {
  const router = useRouter();
  const { supabase, user: authUser } = useDevapp();
  const { toast } = useToast();
  const [guestVoteCount, setGuestVoteCount] = useState(0);
  const [voteLocked, setVoteLocked] = useState(false);
  const [currentVideos, setCurrentVideos] = useState(videos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setCurrentVideos(videos);
    setCurrentIndex(0); // Reset index when videos change
  }, [videos]);
  
  // Fetch user's favorites
  useEffect(() => {
    if (authUser) {
      supabase.from('favorites').select('item_id').eq('user_id', authUser.id).then(({ data }) => {
        if (data) {
          setFavorites(data.map(fav => fav.item_id));
        }
      });
    }
  }, [authUser, supabase]);


  useEffect(() => {
    if (!authUser) { // Only track for guests
        const storedCount = localStorage.getItem('guestVoteCount');
        setGuestVoteCount(storedCount ? parseInt(storedCount) : 0);
    }
  }, [authUser]);

  const handleGuestVote = () => {
    const newCount = guestVoteCount + 1;
    localStorage.setItem('guestVoteCount', newCount.toString());
    setGuestVoteCount(newCount);
  }

  const handleVoteInternal = async (isTop: boolean) => {
    if (!currentVideos[currentIndex] || !supabase) return;

    if (!authUser) {
        if (guestVoteCount >= 10) {
            router.push('/onboarding');
            return;
        }
        handleGuestVote();
    }

    const video = currentVideos[currentIndex];
    const fieldToIncrement = isTop ? 'top_count' : 'flop_count';
    const scoreChange = isTop ? 1 : -1;

    // Optimistic UI Update
    setCurrentVideos(prev => prev.map((v, i) =>
        i === currentIndex ? { ...v, [fieldToIncrement]: (v[fieldToIncrement as keyof EnrichedVideo] as number || 0) + 1, ranking_score: (v.rankingScore || 0) + scoreChange } : v
    ));
    
    // DB update
    const { error } = await supabase.rpc('update_video_vote', {
        video_id: video.id,
        field_to_increment: fieldToIncrement,
        score_change: scoreChange
    });

    if (error) {
        // Revert Optimistic Update
        toast({title: 'Vote failed', description: 'Your vote could not be saved.', variant: 'destructive'});
        setCurrentVideos(prev => prev.map((v, i) =>
            i === currentIndex ? { ...v, [fieldToIncrement]: ((v[fieldToIncrement as keyof EnrichedVideo] as number) || 1) - 1, ranking_score: (v.rankingScore || 0) - scoreChange } : v
        ));
    }
    
    if (authUser) {
        await supabase.from('user_votes').insert({
            user_id: authUser.id,
            video_id: video.id,
            is_positive: isTop,
        });
    }

    if (!isTop) {
        setTimeout(() => nextVideo(), 300);
    } else {
         setTimeout(() => nextVideo(), 300);
    }
};

const onVote = (isTop: boolean) => {
    if (voteLocked) return;
    setVoteLocked(true);
    handleVoteInternal(isTop);
    setTimeout(() => {
        setVoteLocked(false);
    }, 700);
};

   const nextVideo = useCallback(() => {
    setCurrentIndex(prev => (prev < currentVideos.length - 1 ? prev + 1 : prev));
  }, [currentVideos.length]);
  
   const prevVideo = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
   }, []);
   
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          nextVideo();
        } else if (e.key === 'ArrowUp') {
          prevVideo();
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 50) {
          nextVideo();
        } else if (e.deltaY < -50) {
          prevVideo();
        }
      };

      const handleTouchStart = (e: TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        if (diff > 50) {
          nextVideo();
        } else if (diff < -50) {
          prevVideo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('wheel', handleWheel);
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }, [nextVideo, prevVideo, touchStartY]);


   const handleFavorite = useCallback(async (videoId: string) => {
    if (!authUser || !supabase) {
      toast({ title: "Please log in to save favorites.", variant: "destructive" });
      return;
    }
    
    const isFavorited = favorites.includes(videoId);

    if (isFavorited) {
      // Optimistic removal
      setFavorites(current => current.filter(id => id !== videoId));
      const { error } = await supabase.from('favorites').delete().match({ user_id: authUser.id, item_id: videoId });
      if (error) {
        toast({ title: "Failed to unfavorite", variant: 'destructive'});
        // Revert
        setFavorites(current => [...current, videoId]);
      } else {
        toast({ title: "Removed from favorites." });
      }
    } else {
      // Optimistic add
      setFavorites(current => [...current, videoId]);
      const { error } = await supabase.from('favorites').insert({ user_id: authUser.id, item_id: videoId, item_type: 'video' });
      if (error) {
        toast({ title: "Failed to favorite", variant: 'destructive'});
        // Revert
        setFavorites(current => current.filter(id => id !== videoId));
      } else {
        toast({ title: "Added to favorites!" });
      }
    }
  }, [supabase, authUser, toast, favorites]);
  
  const currentVideo = currentVideos[currentIndex];

  if (currentVideos.length === 0 && !isLoading) {
    return (
      <div className="h-screen w-full flex flex-col bg-black">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} />
        <div className="flex-1 flex items-center justify-center text-center px-4">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">No Videos Found</h2>
                <p className="text-muted-foreground mb-6">There are no videos in this category yet.</p>
                <Button onClick={() => setActiveFeedTab('music')}>Switch to Music</Button>
            </div>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} />
        <div className="h-full pt-14 pb-16">
            {currentVideo && (
                <VideoCard 
                    key={currentVideo.id} 
                    video={currentVideo}
                    onVote={(isTop: boolean) => onVote(isTop)}
                    onFavorite={handleFavorite}
                    guestVoteCount={guestVoteCount}
                    onGuestVote={handleGuestVote}
                    currentUser={currentUser}
                    nextVideo={nextVideo}
                    prevVideo={prevVideo}
                    voteLocked={voteLocked}
                    isPlaying={true}
                    isFavorited={favorites.includes(currentVideo.id)}
                />
            )}
        </div>
        <BottomNavBar />
    </div>
  );
}
