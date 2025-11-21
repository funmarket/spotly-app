'use client';
import { useRef, useState, useEffect } from 'react';
import type { EnrichedVideo, UserVote, Favorite } from '@/lib/types';
import { useOnScreen } from '@/hooks/use-on-screen';
import { VideoPlayer } from './video-player';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  CircleDollarSign,
  Share2,
  MessageCircle,
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
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}) => (
  <div className="flex flex-col items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className={`h-12 w-12 rounded-full text-white bg-black/30 hover:bg-primary/80 hover:text-primary-foreground ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      <Icon className="h-6 w-6" />
    </Button>
    <span className="text-xs font-semibold text-white">{label}</span>
  </div>
);

export function VideoCard({ video }: { video: EnrichedVideo }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(cardRef);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [topCount, setTopCount] = useState(video.topCount || 0);
  const [flopCount, setFlopCount] = useState(video.flopCount || 0);
  const [userVote, setUserVote] = useState<'top' | 'flop' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!user || !firestore) return;

    const checkUserEngagement = async () => {
      // Check for existing vote
      setIsVoteLoading(true);
      const voteQuery = query(
        collection(firestore, 'user_votes'),
        where('userId', '==', user.uid),
        where('videoId', '==', video.id),
        limit(1)
      );
      const voteSnapshot = await getDocs(voteQuery);
      if (!voteSnapshot.empty) {
        const voteData = voteSnapshot.docs[0].data() as UserVote;
        setUserVote(voteData.isPositive ? 'top' : 'flop');
      }
      setIsVoteLoading(false);

      // Check for existing favorite
      setIsFavoriteLoading(true);
      const favQuery = query(
        collection(firestore, 'favorites'),
        where('userId', '==', user.uid),
        where('itemId', '==', video.id),
        where('itemType', '==', 'video'),
        limit(1)
      );
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
    if (!firestore || !user) {
      toast({ title: 'Please log in to vote', variant: 'destructive' });
      return;
    }
    if (isVoteLoading) return;

    setIsVoteLoading(true);
    const batch = writeBatch(firestore);
    const videoRef = doc(firestore, 'videos', video.id);

    // If user has an existing vote, we need to revert it and apply the new one
    if (userVote) {
      // Find the existing vote document to delete it
      const existingVoteQuery = query(
        collection(firestore, 'user_votes'),
        where('userId', '==', user.uid),
        where('videoId', '==', video.id),
        limit(1)
      );
      const existingVoteSnapshot = await getDocs(existingVoteQuery);

      if (!existingVoteSnapshot.empty) {
        const existingVoteDoc = existingVoteSnapshot.docs[0];
        // 1. Delete the old vote document
        batch.delete(existingVoteDoc.ref);

        // 2. Revert the old counts
        if (userVote === 'top') {
          batch.update(videoRef, { topCount: increment(-1) });
          setTopCount((p) => p - 1);
        } else {
          batch.update(videoRef, { flopCount: increment(-1) });
          setFlopCount((p) => p - 1);
        }
      }
    }

    // Determine if the user is changing their vote or casting a new one
    const newVoteType = isTop ? 'top' : 'flop';

    if (userVote === newVoteType) {
      // User is un-voting, state already reverted above.
      setUserVote(null);
    } else {
      // User is casting a new vote or changing their vote.
      const votesCollection = collection(firestore, 'user_votes');
      batch.set(doc(votesCollection), {
        videoId: video.id,
        userId: user.uid,
        isPositive: isTop,
        createdAt: serverTimestamp(),
      });

      if (isTop) {
        batch.update(videoRef, { topCount: increment(1) });
        setTopCount((p) => p + 1);
      } else {
        batch.update(videoRef, { flopCount: increment(1) });
        setFlopCount((p) => p + 1);
      }
      setUserVote(newVoteType);
    }

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Error processing your vote', variant: 'destructive' });
      // Revert optimistic UI updates if batch fails
      setTopCount(video.topCount);
      setFlopCount(video.flopCount);
    } finally {
      setIsVoteLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!firestore || !user) {
      toast({ title: 'Please log in to save favorites', variant: 'destructive' });
      return;
    }
    if (isFavoriteLoading) return;
    setIsFavoriteLoading(true);

    try {
      if (isFavorite && favoriteId) {
        // Un-favorite
        await deleteDoc(doc(firestore, 'favorites', favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
        toast({ title: 'Removed from favorites' });
      } else {
        // Favorite
        const favCollection = collection(firestore, 'favorites');
        const newFavDoc = await addDoc(favCollection, {
          itemId: video.id,
          itemType: 'video',
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        setIsFavorite(true);
        setFavoriteId(newFavDoc.id);
        toast({ title: 'Added to favorites!' });
      }
    } catch (error) {
      console.error('Error favoriting:', error);
      toast({ title: 'Error updating favorites', variant: 'destructive' });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
    >
      <VideoPlayer src={video.videoUrl} isPlaying={isVisible} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      <div className="absolute bottom-5 left-5 right-[100px] text-white">
        <Link
          href={`/profile/${video.user.walletAddress}`}
          className="flex items-center gap-3 mb-2 group"
        >
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={video.user.profilePhotoUrl} alt={video.user.username} />
            <AvatarFallback>{video.user.username?.slice(1, 3)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg group-hover:underline">{video.user.username}</h3>
            <p className="text-sm font-light text-white/80">{video.user.bio?.substring(0,40)}...</p>
          </div>
        </Link>
        <p className="font-body text-base">{video.description}</p>
        <div className="mt-2">
            {video.videoCategory && <Badge variant="secondary" className="font-bold capitalize">#{video.videoCategory}</Badge>}
        </div>
      </div>

      <div className="absolute right-3 bottom-5 flex flex-col items-center gap-5">
        <ActionButton
          icon={ThumbsUp}
          label={formatCount(topCount)}
          onClick={() => handleVote(true)}
          isActive={userVote === 'top'}
          isDisabled={isVoteLoading}
        />
        <ActionButton
          icon={ThumbsDown}
          label={formatCount(flopCount)}
          onClick={() => handleVote(false)}
          isActive={userVote === 'flop'}
          isDisabled={isVoteLoading}
        />
        <ActionButton icon={MessageCircle} label={formatCount(video.commentCount)} />
        <ActionButton
          icon={Bookmark}
          label="Save"
          onClick={handleFavorite}
          isActive={isFavorite}
          isDisabled={isFavoriteLoading}
        />
        <ActionButton icon={Share2} label={formatCount(video.shareCount)} />
        <ActionButton icon={CircleDollarSign} label="Tip" />
      </div>
    </div>
  );
}
