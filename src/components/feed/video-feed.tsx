'use client';
import { useState, useRef, useEffect } from 'react';
import type { EnrichedVideo } from '@/lib/types';
import { VideoCard } from './video-card';
import { Button } from '@/components/ui/button';
import { Search, Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
        <div className="flex items-center gap-2 flex-shrink-0">
           {["music", "acting", "creator", "rising"].map(cat => (
            <Button
              key={cat}
              variant={activeFeedTab === cat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFeedTab(cat)}
              className={`whitespace-nowrap transition-all text-xs sm:text-sm ${activeFeedTab === cat ? 'bg-primary text-primary-foreground' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              {getTabLabel(cat)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button onClick={onSearchClick} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <Search size={20} />
          </Button>
          <Button onClick={onNotificationClick} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SearchModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { firestore } = useFirebase();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ videos: any[], users: any[] }>({ videos: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('videos');

    const handleSearch = async () => {
        if (!searchQuery.trim() || !firestore) return;
        setLoading(true);
        try {
            const lowerQuery = searchQuery.toLowerCase();
            
            // This is a basic client-side search. For production, a dedicated search service like Algolia would be better.
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const videosSnapshot = await getDocs(collection(firestore, 'videos'));

            const users = usersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.username?.toLowerCase().includes(lowerQuery));

            const videos = videosSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(v => v.description?.toLowerCase().includes(lowerQuery) || v.videoCategory?.toLowerCase().includes(lowerQuery));

            setSearchResults({ users, videos });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card text-card-foreground p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search videos, users..."
                            className="flex-1 px-4 py-2 rounded-lg bg-input text-foreground"
                            autoFocus
                        />
                        <Button onClick={handleSearch} disabled={loading}>
                            <Search size={20} />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {['videos', 'users'].map(tab => (
                            <Button key={tab} variant={activeTab === tab ? 'secondary' : 'ghost'} onClick={() => setActiveTab(tab)}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'videos' ? searchResults.videos.length : searchResults.users.length})
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="p-4 pt-0 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeTab === 'videos' && searchResults.videos.map(v => (
                                <div key={v.id} onClick={() => { onClose(); router.push('/'); }} className="p-3 rounded-lg cursor-pointer hover:bg-muted">
                                    <p className="font-bold truncate">{v.description}</p>
                                    <p className="text-muted-foreground text-sm">#{v.videoCategory}</p>
                                </div>
                            ))}
                            {activeTab === 'users' && searchResults.users.map(u => (
                                <div key={u.id} onClick={() => { onClose(); router.push(`/profile/${u.id}`); }} className="p-3 rounded-lg cursor-pointer hover:bg-muted">
                                    <p className="font-bold">{u.username}</p>
                                    <p className="text-muted-foreground text-sm capitalize">{u.role}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function VideoFeed({ videos, activeFeedTab, setActiveFeedTab, isLoading }: { videos: EnrichedVideo[], activeFeedTab: string, setActiveFeedTab: (tab: string) => void, isLoading: boolean }) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const router = useRouter();

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="h-screen w-full flex flex-col bg-black">
        <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => setShowSearchModal(true)} onNotificationClick={() => router.push('/notifications')} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center text-center px-4">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">No Videos Found</h2>
                <p className="text-muted-foreground mb-6">There are no videos in the "{activeFeedTab}" category yet.</p>
                <Button onClick={() => setActiveFeedTab('music')}>Switch to Music</Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh)] w-full snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide">
      <TopCategoryMenu activeFeedTab={activeFeedTab} setActiveFeedTab={setActiveFeedTab} onSearchClick={() => setShowSearchModal(true)} onNotificationClick={() => router.push('/notifications')} unreadCount={0} />
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />

      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} isRisingStar={activeFeedTab === 'rising'} rank={index + 1} />
      ))}
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
