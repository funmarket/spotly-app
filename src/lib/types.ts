import type { Timestamp } from 'firebase/firestore';

export interface User {
  userId: string;
  walletAddress: string;
  username: string;
  profilePhotoUrl: string;
  bannerPhotoUrl: string;
  bio: string;
  role: 'artist' | 'business' | 'fan';
  talentCategory?: 'music' | 'acting' | 'creator';
  socialLinks?: { platform: string; url: string }[];
}

export interface Video {
  videoId: string;
  artistId: string;
  videoUrl: string;
  description: string;
  topCount: number;
  flopCount: number;
  shareCount: number;
  commentCount: number;
  status?: 'active' | 'pending' | 'archived';
  duration?: number;
  isBanned?: boolean;
  adminFlag?: boolean;
  banReason?: string;
  bookCount?: number;
  adoptCount?: number;
  adminReason?: string;
  rankingScore?: number;
  rawVideoInput?: string;
  videoCategory?: string;
  hiddenFromFeed?: boolean;
  createdAt: Timestamp | string; // Allow string for mock data
  updatedAt?: Timestamp | string;
}


export type EnrichedVideo = Omit<Video, 'videoId'> & {
  id: string; // Document ID from Firestore
  user: User;
};
    