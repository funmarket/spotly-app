'use client';
import { useMemo } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/profile-header';
import { AdminAiInsights } from '@/components/profile/admin-ai-insights';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart, Eye, ThumbsUp, Wallet, Video as VideoIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import type { Video, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AiInsights } from '@/components/profile/ai-insights';

const StatCard = ({ icon: Icon, title, value, color, isLoading }: { icon: React.ElementType, title: string, value: string, color: string, isLoading?: boolean }) => (
  <Card className="bg-card/50">
    <CardContent className="p-4">
       <div className="flex flex-row items-center justify-between space-y-0 pb-2">
         <p className="text-sm font-medium">{title}</p>
         <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
       </div>
       {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
    </CardContent>
  </Card>
);


function ProfileVideos({ userId }: { userId: string }) {
  const firestore = useFirestore();
  
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'videos'),
      where('artistId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);
  
  const { data: videos, isLoading } = useCollection<Video>(videosQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-[9/16] w-full" />
            <CardFooter className="p-2">
              <Skeleton className="h-4 w-3/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!videos || videos.length === 0) {
      return (
          <Card className="col-span-full py-12 text-center">
              <CardContent>
                  <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Videos Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">This artist hasn't uploaded any videos.</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos?.map(video => (
        <Link href="#" key={video.id} className="group">
          <Card className="overflow-hidden">
            <div className="aspect-w-9 aspect-h-16 relative">
              <Image src={`https://picsum.photos/seed/${video.id}/300/500`} alt={video.description} layout="fill" className="object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <CardFooter className="p-2">
              <p className="text-xs text-muted-foreground truncate">{video.description}</p>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
      if (!firestore || !userId) return null;
      return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  const { data: viewingUser, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  if (!isUserLoading && !viewingUser) {
    notFound();
  }
  
  const videosQuery = useMemoFirebase(() => {
    if (!firestore || !viewingUser?.walletAddress) return null;
    return query(
      collection(firestore, 'videos'),
      where('artistId', '==', viewingUser.walletAddress)
    );
  }, [firestore, viewingUser?.walletAddress]);

  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);

  const stats = useMemo(() => {
    if (!videos) return { totalViews: 0, totalTops: 0, totalVideos: 0 };
    return videos.reduce((acc, video) => {
      acc.totalViews += (video.topCount || 0) + (video.flopCount || 0);
      acc.totalTops += video.topCount || 0;
      acc.totalVideos += 1;
      return acc;
    }, { totalViews: 0, totalTops: 0, totalVideos: 0 });
  }, [videos]);
  
  const isAdmin = authUser?.uid === 'HZ2GQg1Qdh4kmGSTjRBAHVwTw88JVqkL1Hda2Y1Tqxgs';
  const isOwnProfile = authUser?.uid === viewingUser?.walletAddress;

  if (isUserLoading || !viewingUser) {
      return <div className="min-h-screen"><Skeleton className="h-64 w-full" /><div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-6"><Skeleton className="h-32 w-full" /></div></div>
  }

  const handleMessage = () => {
    router.push(`/gossip?openConversationWith=${userId}`);
  };

  return (
    <div className="min-h-screen">
      <ProfileHeader user={viewingUser} isOwnProfile={isOwnProfile} onMessage={handleMessage} />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-6">
        <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="mt-6">
               <ProfileVideos userId={viewingUser.walletAddress} />
            </TabsContent>
            <TabsContent value="stats" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Wallet} title="Total Earnings" value="$0" color="text-green-400" isLoading={videosLoading} />
                    <StatCard icon={VideoIcon} title="Total Videos" value={stats.totalVideos.toLocaleString()} color="text-primary" isLoading={videosLoading} />
                    <StatCard icon={Eye} title="Total Views" value={stats.totalViews.toLocaleString()} color="text-blue-400" isLoading={videosLoading} />
                    <StatCard icon={ThumbsUp} title="Total Tops" value={stats.totalTops.toLocaleString()} color="text-pink-400" isLoading={videosLoading} />
                </div>
            </TabsContent>
            <TabsContent value="insights" className="mt-6">
              {isAdmin && <AdminAiInsights />}
              {(isOwnProfile && viewingUser.role === 'artist') && <AiInsights artistId={userId} />}
              {!isOwnProfile && !isAdmin && (
                  <Card className="col-span-full py-12 text-center">
                    <CardContent>
                      <h3 className="text-lg font-semibold">Private Insights</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        AI-generated insights are only visible to the artist and administrators.
                      </p>
                    </CardContent>
                  </Card>
              )}
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
