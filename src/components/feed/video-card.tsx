'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import type { EnrichedVideo, UserVote, Favorite, User } from '@/lib/types';
import { useOnScreen } from '@/hooks/use-on-screen';
import { VideoPlayer } from './video-player';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  DollarSign
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useCollection } from '@/firebase';

const BookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const AdoptIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20v-6M9 17H6M15 17h3M12 20a7 7 0 0 1-7-7V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a7 7 0 0 1-7 7Z"></path><path d="M12 8a2 2 0 0 0-2 2v0a2 2 0 0 0 4 0v0a2 2 0 0 0-2-2Z"></path></svg>
);


function formatCount(num: number | undefined): string {
  if (num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  isActive,
  isDisabled,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  className?: string;
}) => (
  <div className="flex flex-col items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className={
        `h-12 w-12 rounded-full text-white bg-black/40 backdrop-blur-sm hover:bg-white/20 transition-colors duration-200
        ${isActive ? '!bg-primary text-primary-foreground' : ''} ${className}`
      }
      onClick={onClick}
      disabled={isDisabled}
    >
      <Icon className="h-6 w-6" />
    </Button>
    <span className="text-xs font-semibold text-white drop-shadow-md">{label}</span>
  </div>
);

export function VideoCard({ video, onVote, onFavorite, guestVoteCount, onGuestVote, currentUser, nextVideo }: { video: EnrichedVideo, onVote: (videoId: string, isTop: boolean) => Promise<void>, onFavorite: (videoId: string) => Promise<void>, guestVoteCount: number, onGuestVote: () => void, currentUser: User | null, nextVideo: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(cardRef);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [topCount, setTopCount] = useState(video.topCount || 0);
  const [flopCount, setFlopCount] = useState(video.flopCount || 0);
  const [userVote, setUserVote] = useState<'top' | 'flop' | null>(null);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [showVoteLimitModal, setShowVoteLimitModal] = useState(false);
  
  const favoritesQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', video.id));
  }, [firestore, user, video.id]);

  const { data: favorites } = useCollection<Favorite>(favoritesQuery);
  const isFavorited = (favorites || []).length > 0;


  const getSubRole = (user: User) => {
    if (user.talentCategory) {
      const cat = user.talentCategory.charAt(0).toUpperCase() + user.talentCategory.slice(1);
      if (user.role === 'artist') return cat;
    }
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }

  const handleVote = async (isTop: boolean) => {
    if (isVoteLoading) return;

    if (!currentUser) { // Guest user
      if (guestVoteCount >= 10) {
        setShowVoteLimitModal(true);
        return;
      }
      onGuestVote();
    }

    setIsVoteLoading(true);

    // Optimistic UI update
    if (userVote === 'top') setTopCount(p => p - 1);
    if (userVote === 'flop') setFlopCount(p => p - 1);

    const newVoteType = userVote === (isTop ? 'top' : 'flop') ? null : (isTop ? 'top' : 'flop');

    if (newVoteType === 'top') setTopCount(p => p + 1);
    if (newVoteType === 'flop') setFlopCount(p => p + 1);
    setUserVote(newVoteType);
    
    if (!isTop) {
        setTimeout(() => nextVideo(), 300);
    }

    try {
      await onVote(video.id, isTop);
    } catch (error) {
      // Revert UI on failure
      toast({ title: 'Error processing your vote', variant: 'destructive' });
      setTopCount(video.topCount || 0);
      setFlopCount(video.flopCount || 0);
      setUserVote(null); 
    } finally {
      setIsVoteLoading(false);
    }
  };
  
  const handleHireOrAdopt = () => {
    if (!currentUser || currentUser.role !== 'business') {
        toast({
            title: 'Business Feature',
            description: 'Hiring and adopting talent is available for Business accounts.',
            variant: 'destructive'
        })
        return;
    }
    // TODO: Implement Hire/Adopt modal
  }


  return (
    <div ref={cardRef} className="h-screen w-full snap-start relative flex items-center justify-center bg-black pt-14">
        <Dialog open={showVoteLimitModal} onOpenChange={setShowVoteLimitModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Vote Limit Reached</DialogTitle>
                    <DialogDescription>
                        You've used your 10 free votes as a guest. Create a free profile to continue voting on unlimited videos.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVoteLimitModal(false)}>Later</Button>
                    <Button onClick={() => router.push('/onboarding')}>Create Profile</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <VideoPlayer src={video.videoUrl} isPlaying={isVisible} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      <div className="absolute bottom-16 sm:bottom-5 left-5 right-[100px] text-white">
        <Link href={`/profile/${video.user.walletAddress}`} className="flex items-center gap-3 mb-3 group">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={video.user.profilePhotoUrl} alt={video.user.username} />
            <AvatarFallback>{video.user.username?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg group-hover:underline drop-shadow-lg">{video.user.username}</h3>
            <p className="text-sm font-light text-white/80 drop-shadow-lg capitalize">{getSubRole(video.user)}</p>
          </div>
        </Link>
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <ActionButton icon={ThumbsUp} label="Top" onClick={() => handleVote(true)} isActive={userVote === 'top'} isDisabled={isVoteLoading} />
        <ActionButton icon={ThumbsDown} label="Flop" onClick={() => handleVote(false)} isActive={userVote === 'flop'} isDisabled={isVoteLoading} />
        <ActionButton icon={Bookmark} label="Save" onClick={() => onFavorite(video.id)} isActive={isFavorited} className={isFavorited ? '!bg-yellow-500' : ''} />
        <ActionButton icon={Share2} label="Share" onClick={() => toast({ title: 'Sharing not implemented yet.' })} />
         {currentUser?.role === 'business' && (
            <>
                <ActionButton icon={BookIcon} label="Hire" onClick={handleHireOrAdopt} className="hover:bg-cyan-500/80" />
                <ActionButton icon={AdoptIcon} label="Adopt" onClick={handleHireOrAdopt} className="hover:bg-purple-500/80" />
            </>
        )}
      </div>
    </div>
  );
}
