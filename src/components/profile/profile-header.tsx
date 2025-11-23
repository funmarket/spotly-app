import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Mail, UserPlus, Twitter, Instagram, Youtube, Globe, Facebook, Music, LogOut, Check, Star, VideoIcon, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { useDevapp } from '@/hooks/use-devapp';

const socialIcons: { [key: string]: React.ReactNode } = {
  twitter: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <Music className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

const StatItem = ({ icon: Icon, value, label }: { icon: React.ElementType, value: number, label: string }) => (
    <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <div>
            <p className="font-bold text-sm">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    </div>
);

export function ProfileHeader({ user, isOwnProfile, stats }: { user: User, isOwnProfile: boolean, stats: { points: number, videos: number, views: number }}) {
  const { userWallet, supabase } = useDevapp();
  const socialLinks = user.socialLinks || {};
  const tags = user.talentSubcategories || [];

  const isFollowing = user.followers?.includes(userWallet || '');

  const handleFollowToggle = async () => {
      if (!userWallet || isOwnProfile) return;
      
      const rpcName = isFollowing ? 'unfollow_user' : 'follow_user';

      const { error } = await supabase.rpc(rpcName, {
          p_follower_id: userWallet,
          p_following_id: user.walletAddress
      });

      if (error) {
        console.error('Follow/Unfollow error:', error);
      } else {
        // Force a refresh or optimistically update UI
        window.location.reload();
      }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="relative">
      <div className="h-48 md:h-64 w-full overflow-hidden bg-muted">
        {user.bannerPhotoUrl && (
          <Image
            src={user.bannerPhotoUrl}
            alt={`${user.username}'s banner`}
            fill
            className="object-cover"
            priority
            data-ai-hint="banner image"
          />
        )}
         <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24">
          <div className="flex flex-col md:flex-row items-center md:items-end md:space-x-5">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-background">
                <AvatarImage src={user.profilePhotoUrl} alt={user.username} data-ai-hint="profile picture" />
                <AvatarFallback className="text-4xl">
                  {user.username?.slice(0, 2) || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 md:mt-0 md:pb-4 flex-1 flex flex-col md:flex-row items-center justify-between w-full">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
                    {user.username}
                  </h1>
                   <div className="mt-3 flex justify-center md:justify-start items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    {user.talentCategory && <Badge variant="outline" className="capitalize">{user.talentCategory}</Badge>}
                    {tags.slice(0, 3).map((tag: string) => <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>)}
                  </div>
                </div>
              </div>
          </div>
          
          <div className="mt-4 space-y-4">
              <p className="text-muted-foreground text-center md:text-left text-sm max-w-2xl">{user.bio}</p>
          
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4 sm:gap-6 p-3 rounded-lg bg-muted/50 w-full sm:w-auto justify-center">
                    <StatItem icon={Star} value={stats.points} label="Points" />
                    <StatItem icon={VideoIcon} value={stats.videos} label="Videos" />
                    <StatItem icon={Eye} value={stats.views} label="Views" />
                 </div>

                 <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {isOwnProfile ? (
                        <>
                           <Button variant="outline" asChild className="flex-1 sm:flex-initial">
                             <Link href="/profile/edit">Edit Profile</Link>
                           </Button>
                           <Button variant="ghost" onClick={handleLogout} className="flex-1 sm:flex-initial">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                           </Button>
                        </>
                    ) : (
                        <>
                           <Button onClick={handleFollowToggle} className="flex-1">
                               {isFollowing ? <Check className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4" />}
                               {isFollowing ? 'Following' : 'Follow'}
                           </Button>
                           <Button variant="outline" asChild className="flex-1">
                                <Link href={`/gossip?openConversationWith=${user.walletAddress}`}>
                                    <Mail className="mr-2 h-4 w-4" /> Message
                                </Link>
                           </Button>
                        </>
                    )}
                 </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

    