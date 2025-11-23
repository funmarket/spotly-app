'use client';
import { useDevapp } from '@/hooks/use-devapp';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import type { User, Notification } from '@/lib/types';
import { useEffect, useState } from 'react';


function NotificationItem({ notification, sender }: { notification: Notification, sender: User | null }) {
  const { supabase } = useDevapp();

  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })
    : 'just now';

  const markAsRead = async () => {
    if (!supabase || notification.read) return;
    await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
  };
  
  const getLink = () => {
      switch(notification.type) {
          case 'follow':
              return `/profile/${notification.senderWallet}`;
          case 'message':
              return `/gossip`;
          case 'tip':
          case 'booking':
          case 'adoption':
              return `/profile/${notification.recipientWallet}`;
          case 'order_shipped':
          case 'order_completed':
              return `/marketplace`;
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
                <AvatarFallback>{sender.username?.charAt(0)}</AvatarFallback>
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
    const { userWallet, supabase } = useDevapp();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [senders, setSenders] = useState<Record<string, User | null>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!userWallet) {
                setIsLoading(false);
                return;
            };

            setIsLoading(true);

            const { data: notifs, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('recipient_wallet', userWallet)
                .order('created_at', { ascending: false });

            if (notifs) {
                setNotifications(notifs as Notification[]);
                const senderIds = notifs.map(n => n.sender_wallet).filter(Boolean) as string[];
                if (senderIds.length > 0) {
                    const { data: senderData, error: senderError } = await supabase
                        .from('users')
                        .select('*')
                        .in('wallet_address', senderIds);
                    
                    if (senderData) {
                        const senderMap = senderData.reduce((acc, user) => {
                            acc[user.wallet_address] = user as User;
                            return acc;
                        }, {} as Record<string, User | null>);
                        setSenders(senderMap);
                    }
                }
            }
            setIsLoading(false);
        }
        fetchNotifications();
    }, [supabase, userWallet]);
    
    if (isLoading && notifications.length === 0) {
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

    if (!userWallet) {
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
                        <NotificationItem key={notif.id} notification={notif} sender={senders[notif.senderWallet || ''] || null} />
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
