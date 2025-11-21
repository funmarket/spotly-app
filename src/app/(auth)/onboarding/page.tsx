'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp, signInWithCustomToken } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be 20 characters or less'),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  role: z.enum(['fan', 'artist', 'business'], {
    required_error: 'You need to select a role.',
  }),
});

export default function OnboardingPage() {
  const { firestore, auth, isUserLoading, user } = useFirebase();
  const { publicKey, connected, signMessage } = useWallet();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated'>('idle');

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
    },
  });

  useEffect(() => {
    // This effect handles the sign-in process with Solana and Firebase
    const authenticateWithSolana = async () => {
      if (connected && publicKey && !user && authStatus === 'idle') {
        setAuthStatus('authenticating');
        try {
          // In a real app, you would get this from a secure backend
          // For this example, we'll assume anonymous sign-in or a custom token flow
          // Here, we just need to ensure a Firebase user exists.
          // A simple anonymous user is sufficient for now.
          if (!auth.currentUser) {
             // A real implementation would securely generate a custom token on the backend
             // after verifying wallet ownership.
             // For now, we'll just check if a profile exists for this wallet.
             const userDocRef = doc(firestore, 'users', publicKey.toBase58());
             const docSnap = await getDoc(userDocRef);
             if (docSnap.exists()) {
                 router.replace('/');
             }
          }
          setAuthStatus('authenticated');
        } catch (error) {
          console.error('Firebase authentication error:', error);
          setAuthStatus('idle');
        }
      }
    };
    authenticateWithSolana();
  }, [connected, publicKey, user, authStatus, auth, firestore, router]);


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!publicKey || !firestore) return;

    setIsSubmitting(true);
    try {
      // Use the Solana wallet's public key as the document ID in Firestore
      const userDocRef = doc(firestore, 'users', publicKey.toBase58());
      
      await setDoc(userDocRef, {
        walletAddress: publicKey.toBase58(),
        username: values.username,
        bio: values.bio,
        role: values.role,
        profilePhotoUrl: `https://picsum.photos/seed/${publicKey.toBase58()}/400`,
        bannerPhotoUrl: `https://picsum.photos/seed/banner-${publicKey.toBase58()}/1200/400`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      router.push('/');
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!connected || !publicKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Welcome to TalentVerse!</CardTitle>
            <CardDescription>Connect your Solana wallet to create a profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletMultiButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isUserLoading || authStatus === 'authenticating') {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create Your Profile</CardTitle>
          <CardDescription>You're almost there! Just a few more details.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your cool username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about yourself" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose Your Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="fan" />
                          </FormControl>
                          <FormLabel className="font-normal">Fan - Discover and support talent.</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="artist" />
                          </FormControl>
                          <FormLabel className="font-normal">Artist - Showcase your work.</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="business" />
                          </FormControl>
                          <FormLabel className="font-normal">Business - Find and hire talent.</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
