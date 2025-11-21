'use client';
import { Compass, User, Video, ShoppingCart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="text-center mb-8">
          <h1 className="text-4xl font-headline flex items-center justify-center gap-3 mb-2">
            <Compass className="h-10 w-10 text-primary" />
            Discover
          </h1>
          <p className="text-muted-foreground">Find new talent, videos, and products.</p>
      </div>

       <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for artists, videos, etc..." 
            className="text-lg h-14 pl-12 pr-28"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6">
            Search
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Top Artists</CardTitle>
            <CardDescription>
              See who's climbing the ranks.
            </CardDescription>
          </CardHeader>
        </Card>
         <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Trending Videos</CardTitle>
            <CardDescription>
              Watch the most popular content.
            </CardDescription>
          </CardHeader>
        </Card>
         <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/marketplace')}>
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Marketplace</CardTitle>
            <CardDescription>
              Find exclusive items from creators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
