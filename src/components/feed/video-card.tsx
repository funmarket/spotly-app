'use client';
import { useRef } from 'react';
import type { EnrichedVideo } from '@/lib/types';
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

function formatCount(num: number): string {
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
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) => (
  <div className="flex flex-col items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-12 rounded-full text-white bg-black/30 hover:bg-primary/80 hover:text-primary-foreground"
      onClick={onClick}
    >
      <Icon className="h-6 w-6" />
    </Button>
    <span className="text-xs font-semibold text-white">{label}</span>
  </div>
);

export function VideoCard({ video }: { video: EnrichedVideo }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(cardRef);

  return (
    <div
      ref={cardRef}
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
    >
      <VideoPlayer src={video.videoUrl} isPlaying={isVisible} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      <div className="absolute bottom-5 left-5 right-[100px] text-white">
        <Link
          href={`/profile/${video.user.userId}`}
          className="flex items-center gap-3 mb-2 group"
        >
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={video.user.profilePhotoUrl} alt={video.user.username} />
            <AvatarFallback>{video.user.username.slice(1, 3)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg group-hover:underline">{video.user.username}</h3>
            <p className="text-sm font-light text-white/80">{video.user.bio.substring(0,40)}...</p>
          </div>
        </Link>
        <p className="font-body text-base">{video.description}</p>
        <div className="mt-2">
            <Badge variant="secondary" className="font-bold">#music</Badge>
        </div>
      </div>

      <div className="absolute right-3 bottom-5 flex flex-col items-center gap-5">
        <ActionButton icon={ThumbsUp} label={formatCount(video.topCount)} />
        <ActionButton icon={ThumbsDown} label={formatCount(video.flopCount)} />
        <ActionButton icon={MessageCircle} label={formatCount(video.commentCount)} />
        <ActionButton icon={Bookmark} label="Save" />
        <ActionButton icon={Share2} label={formatCount(video.shareCount)} />
        <ActionButton icon={CircleDollarSign} label="Tip" />
      </div>
    </div>
  );
}
