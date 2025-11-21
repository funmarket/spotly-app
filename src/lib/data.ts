import type { User, Video } from './types';

const users: User[] = [
  {
    userId: '1',
    walletAddress: 'wallet_artist_1',
    username: '@AriaVibes',
    profilePhotoUrl: 'https://picsum.photos/seed/101/200/200',
    bannerPhotoUrl: 'https://picsum.photos/seed/201/1200/400',
    bio: 'Singer-songwriter crafting melodies that touch the soul. ✨ | DM for collabs & bookings.',
    role: 'artist',
    talentCategory: 'music',
    socialLinks: [{ platform: 'twitter', url: '#' }],
  },
  {
    userId: '2',
    walletAddress: 'wallet_artist_2',
    username: '@LeoTheLion',
    profilePhotoUrl: 'https://picsum.photos/seed/102/200/200',
    bannerPhotoUrl: 'https://picsum.photos/seed/204/1200/400',
    bio: 'Actor bringing characters to life. Seeking roles in indie films and theatre. 🎭',
    role: 'artist',
    talentCategory: 'acting',
    socialLinks: [{ platform: 'instagram', url: '#' }],
  },
  {
    userId: '3',
    walletAddress: 'wallet_artist_3',
    username: '@CreatorChloe',
    profilePhotoUrl: 'https://picsum.photos/seed/105/200/200',
    bannerPhotoUrl: 'https://picsum.photos/seed/205/1200/400',
    bio: 'Digital creator exploring the intersection of art and technology. Let\'s build worlds. 🚀',
    role: 'artist',
    talentCategory: 'creator',
    socialLinks: [{ platform: 'youtube', url: '#' }],
  },
  {
    userId: '4',
    walletAddress: 'wallet_fan_1',
    username: '@MusicMaven',
    profilePhotoUrl: 'https://picsum.photos/seed/104/200/200',
    bannerPhotoUrl: 'https://picsum.photos/seed/202/1200/400',
    bio: 'Here for the vibes and discovering new artists.',
    role: 'fan',
  },
];

// Mock videos are now removed as they will be fetched from Firestore.

export const getUsers = (): User[] => users;
export const getUser = (userId: string): User | undefined =>
  users.find((user) => user.userId === userId || user.walletAddress === userId);

// getVideos and getVideosByUser are removed as this data will now come from Firestore.

    