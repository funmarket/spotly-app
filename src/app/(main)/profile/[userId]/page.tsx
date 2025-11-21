'use client';
import { useMemo } from 'react';
import { getUser } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/profile-header';
import { AiInsights } from '@/components/profile/ai-insights';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart, Eye, ThumbsUp, Wallet, Video as VideoIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const user = getUser(params.userId); // Still using mock data for user profile
  if (!user) {
    notFound();
  }
  
  const firestore = useFirestore();
  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'videos'),
      where('artistId', '==', user.walletAddress)
    );
  }, [firestore, user.walletAddress]);

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


  const mainContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} title="Total Earnings" value="$0" color="text-green-400" isLoading={videosLoading} />
        <StatCard icon={VideoIcon} title="Total Videos" value={stats.totalVideos.toLocaleString()} color="text-primary" isLoading={videosLoading} />
        <StatCard icon={Eye} title="Total Views" value={stats.totalViews.toLocaleString()} color="text-blue-400" isLoading={videosLoading} />
        <StatCard icon={ThumbsUp} title="Total Tops" value={stats.totalTops.toLocaleString()} color="text-pink-400" isLoading={videosLoading} />
    </div>
  );

  return (
    <div className="min-h-screen">
      <ProfileHeader user={user} />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 mt-6">
        {user.role === 'artist' ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              {mainContent}
            </TabsContent>
            <TabsContent value="videos" className="mt-6">
               <ProfileVideos userId={user.walletAddress} />
            </TabsContent>
            <TabsContent value="insights" className="mt-6">
              <AiInsights artistId={user.walletAddress} />
            </TabsContent>
          </Tabs>
        ) : (
           mainContent
        )}
      </div>
    </div>
  );
}

    