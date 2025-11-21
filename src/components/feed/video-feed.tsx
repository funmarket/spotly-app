
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { EnrichedVideo, User, Favorite } from '@/lib/types';
import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { Search, Bell, X, Home, Compass, Upload, MessageCircle, User as UserIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, increment, serverTimestamp, query, where, getDocs, limit, deleteDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';

function TopCategoryMenu({ activeFeedTab, setActiveFeedTab, onSearchClick }: { activeFeedTab: string, setActiveFeedTab: (tab: string) => void, onSearchClick: () => void }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'notifications'),
      where('recipientWallet', '==', user.uid),
      where('read', '==', false)
    );
  }, [user, firestore]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadCount = notifications?.length || 0;

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
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto h-14 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
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
    const { user } = useFirebase();
    const router = useRouter();
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
            finalHref = user ? `/profile/${user.uid}` : '/onboarding';
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
  const feedRef = useRef<HTMLDivElement>(null);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [guestVoteCount, setGuestVoteCount] = useState(0);

  useEffect(() => {
    if (!user) { // Only track for guests
        const storedCount = localStorage.getItem('guestVoteCount');
        setGuestVoteCount(storedCount ? parseInt(storedCount) : 0);
    }
  }, [user]);

  const handleGuestVote = () => {
    const newCount = guestVoteCount + 1;
    localStorage.setItem('guestVoteCount', newCount.toString());
    setGuestVoteCount(newCount);
  }

   const handleVote = useCallback(async (videoId: string, isTop: boolean) => {
    if (!user && guestVoteCount >= 10) {
      // Logic to show signup modal is in VideoCard
      return; 
    }
    if (!firestore) return;

    const batch = writeBatch(firestore);
    const videoRef = doc(firestore, 'videos', videoId);
    let voteRef;
    let existingVote: 'top' | 'flop' | null = null;
    let voteDocId: string | null = null;

    if (user) {
        const voteQuery = query(collection(firestore, 'user_votes'), where('userId', '==', user.uid), where('videoId', '==', videoId), limit(1));
        const voteSnapshot = await getDocs(voteQuery);
        if (!voteSnapshot.empty) {
            voteDocId = voteSnapshot.docs[0].id;
            existingVote = voteSnapshot.docs[0].data().isPositive ? 'top' : 'flop';
        }
    }
    
    const newVoteType = (existingVote === (isTop ? 'top' : 'flop')) ? null : (isTop ? 'top' : 'flop');

    // Revert existing vote if there is one
    if (existingVote === 'top') batch.update(videoRef, { topCount: increment(-1), rankingScore: increment(-1) });
    if (existingVote === 'flop') batch.update(videoRef, { flopCount: increment(-1), rankingScore: increment(1) });
    if (voteDocId && user) batch.delete(doc(firestore, 'user_votes', voteDocId));

    // Apply new vote
    if (newVoteType) {
        if(user) {
            batch.set(doc(collection(firestore, 'user_votes')), { videoId: videoId, userId: user.uid, isPositive: isTop, createdAt: serverTimestamp() });
        }
        if (newVoteType === 'top') {
            batch.update(videoRef, { topCount: increment(1), rankingScore: increment(1) });
        } else {
            batch.update(videoRef, { flopCount: increment(1), rankingScore: increment(-1) });
        }
    }
    await batch.commit();
  }, [firestore, user, guestVoteCount]);


   const nextVideo = useCallback(() => {
    feedRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }, []);
  
   const prevVideo = useCallback(() => {
    feedRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
  }, []);

   const handleFavorite = useCallback(async (videoId: string) => {
    if (!user || !firestore) {
      toast({ title: "Please log in to save favorites.", variant: "destructive" });
      return;
    }
    
    const favQuery = query(collection(firestore, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', videoId), limit(1));
    const existing = await getDocs(favQuery);

    if (existing.empty) {
      await addDoc(collection(firestore, 'favorites'), {
        userId: user.uid,
        itemId: videoId,
        itemType: 'video',
        createdAt: serverTimestamp()
      });
      toast({ title: "Added to favorites!" });
    } else {
      await deleteDoc(doc(firestore, 'favorites', existing.docs[0].id));
      toast({ title: "Removed from favorites." });
    }
  }, [firestore, user, toast]);

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="h-screen w-full flex flex-col bg-black">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => {}} />
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
    <div className="h-screen w-full bg-black">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => {}} />
        <div ref={feedRef} className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide pt-14 pb-16">
            {videos.map((video) => (
                <VideoCard 
                    key={video.id} 
                    video={video}
                    onVote={handleVote}
                    onFavorite={handleFavorite}
                    guestVoteCount={guestVoteCount}
                    onGuestVote={handleGuestVote}
                    currentUser={currentUser}
                    nextVideo={nextVideo}
                    prevVideo={prevVideo}
                />
            ))}
        </div>
        <BottomNavBar />
    </div>
  );
}
