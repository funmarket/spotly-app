'use client';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface Notification {
  id: string;
  recipientWallet: string;
  senderWallet?: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string;
  createdAt: { seconds: number; nanoseconds: number };
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { firestore } = useFirebase();
  const sender = notification.senderWallet ? getUser(notification.senderWallet) : null;

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })
    : 'just now';

  const markAsRead = async () => {
    if (!firestore || notification.read) return;
    const notifRef = doc(firestore, 'notifications', notification.id);
    await updateDoc(notifRef, { read: true });
  };
  
  // Basic navigation logic, can be expanded
  const getLink = () => {
      switch(notification.type) {
          case 'follow':
              return `/profile/${notification.senderWallet}`;
          case 'message':
              return `/gossip`; // Or a specific chat
          case 'tip':
          case 'booking':
          case 'adoption':
              return `/profile/${notification.recipientWallet}`;
          case 'order_shipped':
          case 'order_completed':
              return `/marketplace`; // or specific order
          default:
              return '#';
      }
  }

  return (
    <Link href={getLink()} passHref>
        <Card
          onClick={markAsRead}
          className={`cursor-pointer hover:bg-muted/50 ${!notification.read ? 'border-primary/50' : ''}`}
        >
          <CardContent className="p-4 flex items-center gap-4">
            {sender && (
              <Avatar>
                <AvatarImage src={sender.profilePhotoUrl} alt={sender.username} />
                <AvatarFallback>{sender.username.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
            {!notification.read && <div className="h-3 w-3 rounded-full bg-primary" />}
          </CardContent>
        </Card>
    </Link>
  );
}


export default function NotificationsPage() {
    const { user, firestore, isUserLoading } = useFirebase();

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'notifications'),
            where('recipientWallet', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    if (isUserLoading || (isLoading && !notifications)) {
        return (
            <div className="container mx-auto max-w-2xl p-4 space-y-6">
                <h1 className="text-3xl font-headline flex items-center gap-2"><Bell /> Notifications</h1>
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
             <div className="flex flex-1 items-center justify-center h-full">
                <Card className="w-[380px] text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
                      <Bell className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Your Notifications</CardTitle>
                    <CardDescription>
                      Please log in to see your notifications.
                    </CardDescription>
                  </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
            <h1 className="text-3xl font-headline flex items-center gap-2">
                <Bell /> Notifications
            </h1>

            {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map(notif => (
                        <NotificationItem key={notif.id} notification={notif} />
                    ))}
                </div>
            ) : (
                 <Card className="w-full text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted p-3 rounded-full mb-4 w-fit">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="font-headline">No Notifications Yet</CardTitle>
                        <CardDescription>Updates about your activity will appear here.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}