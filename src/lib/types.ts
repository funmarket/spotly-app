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
  createdAt: string;
}

export type EnrichedVideo = Video & {
  user: User;
};
