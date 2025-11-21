import { getUser, getVideosByUser } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/profile-header';
import { AiInsights } from '@/components/profile/ai-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart, Eye, ThumbsUp, Wallet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string, color: string }) => (
  <Card className="bg-card/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const user = getUser(params.userId);
  if (!user) {
    notFound();
  }
  const videos = getVideosByUser(params.userId);

  const mainContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} title="Total Earnings" value="$12,345" color="text-green-400" />
        <StatCard icon={BarChart} title="Ranking Score" value="8,750" color="text-primary" />
        <StatCard icon={Eye} title="Total Views" value="2.1M" color="text-blue-400" />
        <StatCard icon={ThumbsUp} title="Total Tops" value="250K" color="text-pink-400" />
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
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map(video => (
                  <Link href="#" key={video.videoId} className="group">
                    <Card className="overflow-hidden">
                      <div className="aspect-w-9 aspect-h-16 relative">
                        <Image src={`https://picsum.photos/seed/${video.videoId}/300/500`} alt={video.description} layout="fill" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <CardFooter className="p-2">
                        <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
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
