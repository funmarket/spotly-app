
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
  DollarSign,
  Briefcase,
  UserPlus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';


const BookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const AdoptIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20v-6M9 17H6M15 17h3M12 20a7 7 0 0 1-7-7V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a7 7 0 0 1-7 7Z"></path><path d="M12 8a2 2 0 0 0-2 2v0a2 2 0 0 0 4 0v0a2 2 0 0 0-2-2Z"></path></svg>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  isActive,
  isDisabled,
  className = '',
  iconClassName = '',
}: {
  icon: React.ElementType;
  label?: string;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  className?: string;
  iconClassName?: string;
}) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className={`flex flex-col items-center justify-center gap-1 text-white group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60 group-hover:scale-110">
        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 transition-all ${isActive ? 'scale-110' : ''} ${iconClassName}`} />
    </div>
    {label && <span className="text-xs font-semibold drop-shadow-md">{label}</span>}
  </button>
);


export function VideoCard({ video, onVote, onFavorite, guestVoteCount, onGuestVote, currentUser, nextVideo, prevVideo }: { video: EnrichedVideo, onVote: (videoId: string, isTop: boolean) => Promise<void>, onFavorite: (videoId:string) => Promise<void>, guestVoteCount: number, onGuestVote: () => void, currentUser: User | null, nextVideo: () => void, prevVideo: () => void }) {
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
  
  const favoritesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', video.id));
  }, [firestore, user, video.id]);

  const { data: favorites } = useCollection<Favorite>(favoritesQuery);
  const isFavorited = (favorites || []).length > 0;

  const getSubRole = (user: User) => {
    if (user.talentSubcategories && user.talentSubcategories.length > 0) {
        const subcategories = typeof user.talentSubcategories === 'string' ? JSON.parse(user.talentSubcategories) : user.talentSubcategories;
        if (subcategories.length > 0) return subcategories[0];
    }
    if (user.talentCategory) {
      const cat = user.talentCategory.charAt(0).toUpperCase() + user.talentCategory.slice(1);
      if (user.role === 'artist') return cat;
    }
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }

  const handleVote = async (isTop: boolean) => {
    if (isVoteLoading) return;

    if (!user) { // Guest user
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
    router.push(`/profile/${video.user.walletAddress}`);
  }
  
  const handleTip = () => {
      if(!user) {
          toast({ title: 'Please log in to tip artists.', variant: 'destructive' });
          return;
      }
      toast({ title: 'Tipping not implemented yet.'});
  }

  const handleFavoriteClick = () => {
    if (!user) {
        toast({ title: 'Please log in to save videos.', variant: 'destructive' });
        return;
    }
    onFavorite(video.id);
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

      <div className="absolute bottom-20 sm:bottom-5 left-5 right-[100px] text-white">
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
        <p className="text-sm text-white drop-shadow-md line-clamp-2">{video.description}</p>
      </div>
      
      {/* Left Action Bar */}
       <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20">
         <ActionButton icon={ArrowUp} onClick={prevVideo} />
       </div>

      {/* Right Action Bar */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <ActionButton icon={Bookmark} label="Save" onClick={handleFavoriteClick} isActive={isFavorited} iconClassName={isFavorited ? 'fill-white' : ''} />
        <ActionButton icon={ThumbsUp} label="Top" onClick={() => handleVote(true)} isActive={userVote === 'top'} isDisabled={isVoteLoading} iconClassName="text-green-400 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        <ActionButton icon={ThumbsDown} label="Flop" onClick={() => handleVote(false)} isActive={userVote === 'flop'} isDisabled={isVoteLoading} iconClassName="text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <ActionButton icon={ArrowDown} label="Down" onClick={nextVideo} iconClassName="text-gray-400" />
        <ActionButton icon={DollarSign} label="Tip" onClick={handleTip} iconClassName="text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
        
        {currentUser?.role === 'business' && (
            <>
                <ActionButton icon={BookIcon} label="Book" onClick={handleHireOrAdopt} iconClassName="text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <ActionButton icon={AdoptIcon} label="Adopt" onClick={handleHireOrAdopt} iconClassName="text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            </>
        )}
         <ActionButton icon={Share2} label="Share" onClick={() => toast({title: 'Share not implemented'})} />
      </div>
    </div>
  );
}
