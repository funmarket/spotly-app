'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { EnrichedVideo, User } from '@/lib/types';
import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { Search, Bell, X, Home, Compass, Upload, Inbox, User as UserIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  collection,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';


function TopCategoryMenu({ activeFeedTab, setActiveFeedTab, onSearchClick, onNotificationClick, unreadCount }: { activeFeedTab: string, setActiveFeedTab: (tab: string) => void, onSearchClick: () => void, onNotificationClick: () => void, unreadCount: number }) {
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
      { href: '/inbox', label: 'Inbox', icon: Inbox },
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
                className={cn(
                    'flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                )}
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
  const [guestVoteCount, setGuestVoteCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
        setGuestVoteCount(parseInt(localStorage.getItem('guestVoteCount') || '0'));
    }
  }, [currentUser]);

  const handleGuestVote = () => {
    const newCount = guestVoteCount + 1;
    localStorage.setItem('guestVoteCount', newCount.toString());
    setGuestVoteCount(newCount);
  }

   const handleVote = useCallback(async (videoId: string, isTop: boolean) => {
    if (!user && guestVoteCount >= 10) {
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
    if (voteDocId) batch.delete(doc(firestore, 'user_votes', voteDocId));

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

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="h-screen w-full flex flex-col bg-black">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => {}} onNotificationClick={() => router.push('/notifications')} unreadCount={0} />
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
    <div ref={feedRef} className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
      <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => {}} onNotificationClick={() => router.push('/notifications')} unreadCount={0} />

      {videos.map((video) => (
        <VideoCard 
            key={video.id} 
            video={video}
            onVote={handleVote}
            guestVoteCount={guestVoteCount}
            onGuestVote={handleGuestVote}
            currentUser={currentUser}
            nextVideo={nextVideo}
        />
      ))}

      <BottomNavBar />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}
