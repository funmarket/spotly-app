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

const videos: Video[] = [
  {
    videoId: 'v1',
    artistId: 'wallet_artist_1',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/fb-studio-98338.appspot.com/o/spotly%2Fpexels-mikhail-nilov-7524956%20(1080p).mp4?alt=media&token=d58e370a-7063-4752-b816-e555776d49cf',
    description: 'An original song "Starlight Whispers". Hope you enjoy it! #originalmusic #singer',
    topCount: 12500,
    flopCount: 130,
    shareCount: 3200,
    commentCount: 890,
    createdAt: '2024-05-20T10:00:00Z',
  },
  {
    videoId: 'v2',
    artistId: 'wallet_artist_2',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/fb-studio-98338.appspot.com/o/spotly%2Fproduction_id_4763952%20(1080p).mp4?alt=media&token=401349a1-77d7-464a-8d18-5085437877e5',
    description: 'Working on a monologue from my favorite play. What do you think? #acting #theatre',
    topCount: 8800,
    flopCount: 210,
    shareCount: 1500,
    commentCount: 450,
    createdAt: '2024-05-19T15:30:00Z',
  },
  {
    videoId: 'v3',
    artistId: 'wallet_artist_3',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/fb-studio-98338.appspot.com/o/spotly%2Fpexels-polina-tankilevitch-5610260%20(1080p).mp4?alt=media&token=81d7f1e6-4299-44ab-9c2b-1025a1f6a147',
    description: 'My latest digital art piece coming to life. #digitalart #procreate #creative',
    topCount: 25000,
    flopCount: 80,
    shareCount: 7800,
    commentCount: 2200,
    createdAt: '2024-05-21T11:00:00Z',
  },
    {
    videoId: 'v4',
    artistId: 'wallet_artist_1',
    videoUrl: 'https://firebasestorage.googleapis.com/v0/b/fb-studio-98338.appspot.com/o/spotly%2Fpexels-kelly-2927338-4096x2160-25fps.mp4?alt=media&token=78170c0c-15a4-4a5f-832f-76a6e297f6c6',
    description: 'Acoustic cover of a classic. Let me know your requests! #cover #acoustic',
    topCount: 18000,
    flopCount: 95,
    shareCount: 4100,
    commentCount: 1300,
    createdAt: '2024-05-18T18:00:00Z',
  },
];

export const getUsers = (): User[] => users;
export const getVideos = (): Video[] => videos;

export const getUser = (userId: string): User | undefined =>
  users.find((user) => user.userId === userId || user.walletAddress === userId);

export const getVideosByUser = (userId: string): Video[] => {
  const user = getUser(userId);
  if (!user) return [];
  return videos.filter((video) => video.artistId === user.walletAddress);
};
