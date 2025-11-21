'use client';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Referral } from '@/lib/types';
import { format } from 'date-fns';

export default function ReferralsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const referralsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'referrals'),
      where('referrerWallet', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: referrals, isLoading } = useCollection<Referral>(referralsQuery);

  const referralCode = user ? user.uid.slice(0, 8) : '';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${referralCode}`
      : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Copied to clipboard!',
      description: 'Your referral link is ready to be shared.',
    });
  };

  if (isUserLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Card className="w-[350px] text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Referral Program</CardTitle>
            <CardDescription>
              Log in to get your referral link and track your earnings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-headline flex items-center gap-3">
          <Gift className="h-10 w-10" />
          Referral Program
        </h1>
        <p className="text-muted-foreground mt-2">
          Invite friends to TalentVerse and earn rewards for every successful
          referral!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with your friends. When they sign up, you get
            rewarded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input value={referralLink} readOnly />
            <Button size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track the status of your referrals and earnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : referrals && referrals.length > 0 ? (
                referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      {format(
                        new Date(ref.createdAt.seconds * 1000),
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {ref.referredWallet.slice(0, 10)}...
                    </TableCell>
                    <TableCell>{ref.rewardAmount} SOL</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          ref.rewardStatus === 'paid'
                            ? 'default'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {ref.rewardStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No referrals yet. Share your link to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
