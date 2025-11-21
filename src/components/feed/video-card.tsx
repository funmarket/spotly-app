'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import type { EnrichedVideo, UserVote, Favorite, User } from '@/lib/types';
import { useOnScreen } from '@/hooks/use-on-screen';
import { VideoPlayer } from './video-player';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  CircleDollarSign,
  Share2,
  MessageCircle,
  Book,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useFirebase, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  increment,
  writeBatch,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  addDoc,
  limit,
  getDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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

function RankingBanner({ rank, artist, tops, flops, score, onClick }: { rank: number; artist: User; tops: number; flops: number; score: number; onClick: () => void }) {
    const getTalentLabel = () => {
        if (artist.talentCategory) {
            return artist.talentCategory.charAt(0).toUpperCase() + artist.talentCategory.slice(1);
        }
        return 'Artist';
    };

    return (
        <div onClick={onClick} className="absolute top-[70px] left-4 right-4 z-20 cursor-pointer">
            <div className="bg-black/70 backdrop-blur-md border border-primary/50 rounded-lg p-2 flex items-center gap-3">
                <div className="text-primary text-xl font-bold">#{rank}</div>
                <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage src={artist.profilePhotoUrl} />
                    <AvatarFallback>{artist.username.slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                    <p className="font-bold text-white truncate">{artist.username}</p>
                    <p className="text-xs text-muted-foreground">{getTalentLabel()}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-green-400"><ThumbsUp size={14}/> {tops}</div>
                    <div className="flex items-center gap-1 text-red-400"><ThumbsDown size={14}/> {flops}</div>
                    <div className="flex items-center gap-1 text-yellow-400">📊 {score}</div>
                </div>
            </div>
        </div>
    );
}

export function VideoCard({ video, isRisingStar, rank }: { video: EnrichedVideo, isRisingStar: boolean, rank: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(cardRef);
  const { firestore, user, firebaseApp } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [topCount, setTopCount] = useState(video.topCount || 0);
  const [flopCount, setFlopCount] = useState(video.flopCount || 0);
  const [userVote, setUserVote] = useState<'top' | 'flop' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

  // Modals
  const [modalState, setModalState] = useState<{ type: 'tip' | 'book' | 'adopt' | 'upgrade' | null, data?: any }>({ type: null });
  const [tipAmount, setTipAmount] = useState('');
  const [bookAmount, setBookAmount] = useState('');
  const [bookMessage, setBookMessage] = useState('');
  const [adoptAmount, setAdoptAmount] = useState('');
  const [adoptMessage, setAdoptMessage] = useState('');


  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
        if(user && firestore) {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (userDoc.exists()) {
                setCurrentUserProfile(userDoc.data() as User);
            }
        }
    }
    fetchCurrentUserProfile();
  }, [user, firestore]);

  const isGuest = !user;
  const userRole = currentUserProfile?.role;


  useEffect(() => {
    if (!user || !firestore) return;

    const checkUserEngagement = async () => {
      setIsVoteLoading(true);
      const voteQuery = query(collection(firestore, 'user_votes'), where('userId', '==', user.uid), where('videoId', '==', video.id), limit(1));
      const voteSnapshot = await getDocs(voteQuery);
      if (!voteSnapshot.empty) {
        setUserVote(voteSnapshot.docs[0].data().isPositive ? 'top' : 'flop');
      }
      setIsVoteLoading(false);

      setIsFavoriteLoading(true);
      const favQuery = query(collection(firestore, 'favorites'), where('userId', '==', user.uid), where('itemId', '==', video.id), where('itemType', '==', 'video'), limit(1));
      const favSnapshot = await getDocs(favQuery);
      if (!favSnapshot.empty) {
        setIsFavorite(true);
        setFavoriteId(favSnapshot.docs[0].id);
      }
      setIsFavoriteLoading(false);
    };

    checkUserEngagement();
  }, [user, firestore, video.id]);

  const handleVote = async (isTop: boolean) => {
    if (isGuest) {
      toast({ title: 'Please create an account to vote.', variant: 'destructive', description: "Voting is only for registered users." });
      return;
    }
    if (!firestore || !user || isVoteLoading) return;

    setIsVoteLoading(true);
    const batch = writeBatch(firestore);
    const videoRef = doc(firestore, 'videos', video.id);

    if (userVote) {
      const existingVoteQuery = query(collection(firestore, 'user_votes'), where('userId', '==', user.uid), where('videoId', '==', video.id), limit(1));
      const existingVoteSnapshot = await getDocs(existingVoteQuery);
      if (!existingVoteSnapshot.empty) {
        batch.delete(existingVoteSnapshot.docs[0].ref);
        if (userVote === 'top') {
          batch.update(videoRef, { topCount: increment(-1), rankingScore: increment(-1) });
          setTopCount((p) => p - 1);
        } else {
          batch.update(videoRef, { flopCount: increment(-1), rankingScore: increment(1) });
          setFlopCount((p) => p - 1);
        }
      }
    }

    const newVoteType = isTop ? 'top' : 'flop';
    if (userVote !== newVoteType) {
      batch.set(doc(collection(firestore, 'user_votes')), { videoId: video.id, userId: user.uid, isPositive: isTop, createdAt: serverTimestamp() });
      if (isTop) {
        batch.update(videoRef, { topCount: increment(1), rankingScore: increment(1) });
        setTopCount((p) => p + 1);
      } else {
        batch.update(videoRef, { flopCount: increment(1), rankingScore: increment(-1) });
        setFlopCount((p) => p + 1);
      }
      setUserVote(newVoteType);
    } else {
      setUserVote(null); // Un-voting
    }

    try {
      await batch.commit();
      logEvent(getAnalytics(firebaseApp), 'vote', { video_id: video.id, vote_type: newVoteType });
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Error processing your vote', variant: 'destructive' });
      // Revert UI on failure
      setTopCount(video.topCount || 0);
      setFlopCount(video.flopCount || 0);
    } finally {
      setIsVoteLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (isGuest) {
      toast({ title: 'Please create an account to save favorites.', variant: 'destructive' });
      return;
    }
    if (!firestore || !user || isFavoriteLoading) return;
    
    setIsFavoriteLoading(true);
    try {
      if (isFavorite && favoriteId) {
        await deleteDoc(doc(firestore, 'favorites', favoriteId));
        setIsFavorite(false); setFavoriteId(null);
        toast({ title: 'Removed from favorites' });
      } else {
        const newFavDoc = await addDoc(collection(firestore, 'favorites'), { itemId: video.id, itemType: 'video', userId: user.uid, createdAt: serverTimestamp() });
        setIsFavorite(true); setFavoriteId(newFavDoc.id);
        toast({ title: 'Added to favorites!' });
      }
    } catch (error) {
      console.error('Error favoriting:', error);
      toast({ title: 'Error updating favorites', variant: 'destructive' });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleBookOrAdopt = (type: 'book' | 'adopt') => {
      if (isGuest) {
          router.push('/onboarding');
          return;
      }
      if (userRole && userRole !== 'business') {
          setModalState({ type: 'upgrade' });
          return;
      }
      setModalState({ type });
  };
  
  const handleModalSubmit = async (type: 'tip' | 'book' | 'adopt') => {
      // Logic for submitting Tip, Book, Adopt modals
      toast({title: `Submitting ${type}...`});
      setModalState({type: null});
  }


  return (
    <div ref={cardRef} className="h-screen w-full snap-start relative flex items-center justify-center bg-black pt-14">
      {/* Modals */}
      <Dialog open={modalState.type === 'upgrade'} onOpenChange={(open) => !open && setModalState({type: null})}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Business Feature</DialogTitle>
                  <DialogDescription>Booking and adopting artists is a feature for Business accounts. Please create or switch to a business profile.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setModalState({type: null})}>Cancel</Button>
                  <Button onClick={() => router.push('/onboarding/create/business')}>Create Business Profile</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Other modals for Tip, Book, Adopt */}

      <VideoPlayer src={video.videoUrl} isPlaying={isVisible} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      { isRisingStar && <RankingBanner rank={rank} artist={video.user} tops={topCount} flops={flopCount} score={video.rankingScore} onClick={() => router.push(`/profile/${video.user.walletAddress}`)} />}

      <div className="absolute bottom-16 sm:bottom-5 left-5 right-[100px] text-white">
        <Link href={`/profile/${video.user.walletAddress}`} className="flex items-center gap-3 mb-3 group">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={video.user.profilePhotoUrl} alt={video.user.username} />
            <AvatarFallback>{video.user.username?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg group-hover:underline drop-shadow-lg">{video.user.username}</h3>
            <p className="text-sm font-light text-white/80 drop-shadow-lg truncate">{video.user.bio}</p>
          </div>
        </Link>
        <p className="font-body text-base drop-shadow-lg">{video.description}</p>
        <div className="mt-2">
            {video.videoCategory && <Badge variant="secondary" className="font-bold capitalize backdrop-blur-sm">#{video.videoCategory}</Badge>}
        </div>
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        <ActionButton icon={ThumbsUp} label={formatCount(topCount)} onClick={() => handleVote(true)} isActive={userVote === 'top'} isDisabled={isVoteLoading} />
        <ActionButton icon={ThumbsDown} label={formatCount(flopCount)} onClick={() => handleVote(false)} isActive={userVote === 'flop'} isDisabled={isVoteLoading} />
        <ActionButton icon={Bookmark} label="Save" onClick={handleFavorite} isActive={isFavorite} isDisabled={isFavoriteLoading} />
        <ActionButton icon={CircleDollarSign} label="Tip" onClick={() => setModalState({type: 'tip'})} className="hover:bg-green-500/80" />
        <ActionButton icon={BookIcon} label="Book" onClick={() => handleBookOrAdopt('book')} className="hover:bg-cyan-500/80" />
        <ActionButton icon={AdoptIcon} label="Adopt" onClick={() => handleBookOrAdopt('adopt')} className="hover:bg-purple-500/80" />
      </div>
    </div>
  );
}
