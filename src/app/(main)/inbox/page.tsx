'use client';
import { Inbox } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function InboxPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[380px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Inbox className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Inbox</CardTitle>
          <CardDescription>
            Your messages and conversations will appear here. This feature is coming soon!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
