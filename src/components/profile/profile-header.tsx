import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Mail, UserPlus, Twitter, Instagram, Youtube, Globe, Facebook, Music } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import Link from 'next/link';

const socialIcons: { [key: string]: React.ReactNode } = {
  twitter: <Twitter className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <Music className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

export function ProfileHeader({ user, isOwnProfile, onMessage }: { user: User, isOwnProfile: boolean, onMessage: () => void }) {
  const socialLinks = typeof user.socialLinks === 'string' && user.socialLinks ? JSON.parse(user.socialLinks) : user.socialLinks;
  const extraLinks = typeof user.extraLinks === 'string' && user.extraLinks ? JSON.parse(user.extraLinks) : user.extraLinks;

  return (
    <div className="relative">
      <div className="h-48 md:h-64 w-full overflow-hidden">
        {user.bannerPhotoUrl ? (
          <Image
            src={user.bannerPhotoUrl}
            alt={`${user.username}'s banner`}
            fill
            className="object-cover"
            data-ai-hint="banner image"
          />
        ) : (
          <div className="bg-gradient-to-br from-muted to-secondary h-full w-full" />
        )}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24 flex flex-col md:flex-row items-center md:items-end md:space-x-5">
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
              <p className="text-muted-foreground mt-1 max-w-xl">{user.bio}</p>
              <div className="mt-3 flex justify-center md:justify-start items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                {user.talentCategory && <Badge variant="outline" className="capitalize">{user.talentCategory}</Badge>}
                 {extraLinks?.map((link: {label: string, url: string}, index: number) => (
                   <Button key={index} variant="outline" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </Button>
                 ))}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              {socialLinks && Object.entries(socialLinks).map(([platform, url]) => (
                 url && socialIcons[platform] && (
                    <Button key={platform} variant="outline" size="icon" asChild>
                      <a href={url as string} target="_blank" rel="noopener noreferrer">
                        {socialIcons[platform]}
                      </a>
                    </Button>
                 )
              ))}
              {!isOwnProfile && (
                <>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" /> Follow
                  </Button>
                  <Button onClick={onMessage}>
                    <Mail className="mr-2 h-4 w-4" /> Message
                  </Button>
                </>
              )}
               {isOwnProfile && (
                  <Button variant="outline" asChild>
                     <Link href={`/onboarding/create/${user.role}`}>Edit Profile</Link>
                  </Button>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
