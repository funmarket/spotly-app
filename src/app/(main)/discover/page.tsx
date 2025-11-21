'use client';
import { Compass } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DiscoverPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[380px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Discover</CardTitle>
          <CardDescription>
            This is where you'll discover new talent and content. This feature is coming soon!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
