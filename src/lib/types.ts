
import type { Timestamp } from 'firebase/firestore';

export interface User {
  userId: string;
  walletAddress: string;
  username: string;
  profilePhotoUrl: string;
  bannerPhotoUrl: string;
  bio: string;
  role: 'artist' | 'business' | 'fan' | 'regular';
  subRole?: string;
  talentCategory?: 'music' | 'acting' | 'creator';
  talentSubcategories?: string[];
  socialLinks?: Record<string, string>;
  extraLinks?: { label: string; url: string }[];
  tags?: string;
  location?: string;
  rankingScore?: number;
  escrowBalance?: number;
  isBanned?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  warnings?: number;
  adminNotes?: string;
  isDeleted?: boolean;
  followers?: string[];
  following?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Video {
  id?: string;
  videoId: string;
  artistId: string;
  videoUrl: string;
  description: string;
  topCount: number;
  flopCount: number;
  shareCount: number;
  commentCount: number;
  status: 'active' | 'pending' | 'archived';
  duration?: number;
  isBanned: boolean;
  adminFlag?: boolean;
  banReason?: string;
  bookCount: number;
  adoptCount: number;
  adminReason?: string;
  rankingScore: number;
  rawVideoInput: string;
  videoCategory: string;
  hiddenFromFeed: boolean;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt?: Timestamp | { seconds: number; nanoseconds: number };
}

export type EnrichedVideo = Omit<Video, 'videoId'> & {
  id: string; // Document ID from Firestore
  user: User;
};

export interface Tip {
  fromWallet: string;
  toWallet: string;
  amount: number;
  txSignature: string;
  videoId: string;
  createdAt: Timestamp;
}

export interface Booking {
  bookingId: string;
  userWallet: string;
  artistWallet: string;
  escrowPDA: string;
  amount: number;
  date: string;
  time: string;
  notes: string;
  status: 'escrow_pending' | 'escrow_funded' | 'release_requested' | 'refund_requested' | 'released' | 'refunded';
  txSignature: string;
  createdAt: Timestamp;
}

export interface Adoption {
  sponsorWallet: string;
  artistWallet: string;
  amount: number;
  tier: 'bronze' | 'silver' | 'gold';
  recurring: boolean;
  txSignature: string;
  createdAt: Timestamp;
}


export interface GossipPost {
  id: string;
  authorId: string;
  content: string;
  commentsCount: number;
  createdAt: Timestamp;
  imageUrl?: string;
  category?: string;
  avgRating?: number;
  ratingCount?: number;
}

export interface GossipComment {
  id?: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
}

export interface GossipRating {
  postId: string;
  raterId: string;
  rating: number;
}

export interface GossipUserFollow {
  followerId: string;
  followingId: string;
}

export interface GossipMessage {
  id?: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: Timestamp;
}

export interface GossipServiceAd {
  title: string;
  content: string;
  imageUrl: string;
  targetUrl: string;
}

export interface UserVote {
  id?: string;
  videoId: string;
  userId: string;
  isPositive: boolean;
  createdAt: Timestamp;
}

export interface Favorite {
  id?: string;
  itemId: string;
  itemType: 'video' | 'product';
  userId: string;
  createdAt: Timestamp;
}

export interface Referral {
  id?: string;
  referrerWallet: string;
  referredWallet: string;
  rewardAmount: number;
  rewardStatus: 'pending' | 'paid';
  createdAt: Timestamp;
}

export interface MarketplaceProduct {
    id: string;
    sellerId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive' | 'sold_out';
    imageUrl: string;
    category: string;
    subcategory?: string;
    createdAt: Timestamp | { seconds: number; nanoseconds: number };
}

export interface Notification {
  id: string;
  recipientWallet: string;
  senderWallet?: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string;
  createdAt: { seconds: number, nanoseconds: number };
}

    