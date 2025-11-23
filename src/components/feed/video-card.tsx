'use client';
import { useRef, useState, useEffect } from 'react';
import type { EnrichedVideo, User } from '@/lib/types';
import VideoPlayer from './video-player';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useDevapp } from '@/hooks/use-devapp';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import ResponsiveSidebar from './ResponsiveSidebar';
import LeftUpArrow from './LeftUpArrow';
import './ResponsiveSidebar.css';
import { TipModal } from '../modals/TipModal';
import { BookModal } from '../modals/BookModal';
import { AdoptModal } from '../modals/AdoptModal';
import { useWallet } from '@solana/wallet-adapter-react';


export function VideoCard({ video, onVote, onFavorite, guestVoteCount, onGuestVote, currentUser, nextVideo, prevVideo, voteLocked, isPlaying, isFavorited }: { video: EnrichedVideo, onVote: (isTop: boolean) => Promise<void>, onFavorite: (videoId:string) => Promise<void>, guestVoteCount: number, onGuestVote: () => void, currentUser: User | null, nextVideo: () => void, prevVideo: () => void, voteLocked: boolean, isPlaying: boolean, isFavorited: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { supabase, user: authUser, userWallet } = useDevapp();
  const { toast } = useToast();
  const router = useRouter();
  const wallet = useWallet();

  const [showVoteLimitModal, setShowVoteLimitModal] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleVoteClick = (isTop: boolean) => {
    if (voteLocked) return;
    if (!userWallet) { // Guest user
      if (guestVoteCount >= 10) {
        setShowVoteLimitModal(true);
        return;
      }
      onGuestVote();
    }
    onVote(isTop);
  };
  
  const handleHireOrAdopt = () => {
    if (!currentUser || currentUser.role !== 'business') {
        setBookOpen(true);
        return;
    }
    router.push(`/profile/${video.user.walletAddress}`);
  }
  
const handleTip = async (amount: number) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        toast({ title: "Please connect your wallet to tip.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await supabase.functions.invoke('tip', {
            body: {
                recipientWallet: video.user.walletAddress,
                amountSol: amount,
                videoId: video.id,
            }
        });

        if (response.error) throw new Error(response.error.message);
        if (response.data && response.data.ok === false) throw new Error("Function returned an error.");


        toast({ title: 'Tip sent!', description: `You sent ${amount} SOL to ${video.user.username}` });
    } catch (err: any) {
        console.error("Tip failed:", err);
        toast({ title: "Tip Failed", description: err.message || "Could not complete the tip transaction.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setTipOpen(false);
    }
};

const handleBook = async (payload: { date: string; time: string; budget: number; notes: string; }) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        toast({ title: "Please connect your wallet to book.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        
        const response = await supabase.functions.invoke('book', {
            body: {
                artistWallet: video.user.walletAddress,
                videoId: video.id,
                date: payload.date,
                time: payload.time,
                budgetSol: payload.budget,
                details: payload.notes,
            }
        });

        if (response.error) throw new Error(response.error.message);
        if (response.data && response.data.ok === false) throw new Error("Function returned an error.");


        toast({ title: 'Booking Request Sent!', description: `Your request has been sent to ${video.user.username}` });
    } catch (err: any) {
        console.error("Booking failed:", err);
        toast({ title: "Booking Failed", description: err.message || "Could not complete the booking transaction.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setBookOpen(false);
    }
};

const handleAdopt = async (payload: { tier: string; amount: number; recurring: boolean; message: string; }) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        toast({ title: "Please connect your wallet to adopt.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await supabase.functions.invoke('adopt', {
            body: {
                artistWallet: video.user.walletAddress,
                videoId: video.id,
                tier: payload.tier,
                amountSol: amount,
                monthly: payload.recurring,
                message: payload.message,
            }
        });
        
        if (response.error) throw new Error(response.error.message);
        if (response.data && response.data.ok === false) throw new Error("Function returned an error.");


        toast({ title: 'Adoption Confirmed!', description: `You are now sponsoring ${video.user.username}` });
    } catch (err: any) {
        console.error("Adoption failed:", err);
        toast({ title: "Adoption Failed", description: err.message || "Could not complete the adoption transaction.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setAdoptOpen(false);
    }
};

  const handleFavoriteClick = () => {
    if (!authUser) {
        toast({ title: 'Please log in to save videos.', variant: 'destructive' });
        return;
    }
    onFavorite(video.id);
  }


  return (
    <div ref={cardRef} className="h-full w-full relative flex items-center justify-center bg-black">
      <TipModal
        isOpen={tipOpen}
        artistName={video.user.username}
        onClose={() => setTipOpen(false)}
        onConfirmTip={handleTip}
        isSubmitting={isSubmitting}
      />
      <BookModal
        isOpen={bookOpen}
        artistName={video.user.username}
        onClose={() => setBookOpen(false)}
        onConfirmBooking={handleBook}
        isSubmitting={isSubmitting}
      />
      <AdoptModal
        isOpen={adoptOpen}
        artistName={video.user.username}
        onClose={() => setAdoptOpen(false)}
        onConfirmAdopt={handleAdopt}
        isSubmitting={isSubmitting}
      />

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

      <VideoPlayer videoUrl={video.rawVideoInput} isActive={isPlaying} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      <div className="absolute bottom-20 left-5 right-5 text-white">
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
      
      <LeftUpArrow onClick={prevVideo} />
      <ResponsiveSidebar
        onSave={handleFavoriteClick}
        onUp={() => handleVoteClick(true)}
        onFlop={() => handleVoteClick(false)}
        onDown={nextVideo}
        onTip={() => setTipOpen(true)}
        onBook={() => setBookOpen(true)}
        onAdopt={() => setAdoptOpen(true)}
        isFavorited={isFavorited}
      />

    </div>
  );
}

    