'use client';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusSquare, Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

const videoSchema = z.object({
  rawVideoInput: z.string().url({ message: 'Please enter a valid video URL.' }),
  description: z.string().min(1, { message: 'Please add a description.' }).max(500),
  videoCategory: z.string().min(1, { message: 'Please select a category.' }),
});

export default function SubmitVideoPage() {
  const { user, isUserLoading, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<z.infer<typeof videoSchema>>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      rawVideoInput: '',
      description: '',
      videoCategory: '',
    },
  });
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && firestore) {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as User);
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setIsProfileLoading(false);
        }
      } else if (!isUserLoading) {
        // If there's no user and we're not loading one, profile loading is done.
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, firestore, isUserLoading]);

  async function onSubmit(values: z.infer<typeof videoSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a video.',
      });
      return;
    }
    
    if (userProfile?.role !== 'artist') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only artists can submit videos.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const videosCollection = collection(firestore, 'videos');

    try {
      await addDoc(videosCollection, {
        artistId: user.uid,
        rawVideoInput: values.rawVideoInput,
        description: values.description,
        videoCategory: values.videoCategory.toLowerCase().trim(),
        // Backend/cloud function will process rawVideoInput into a normalized videoUrl
        videoUrl: values.rawVideoInput, // Placeholder, to be replaced by backend
        status: 'pending',
        isBanned: false,
        hiddenFromFeed: false,
        topCount: 0,
        flopCount: 0,
        shareCount: 0,
        commentCount: 0,
        bookCount: 0,
        adoptCount: 0,
        rankingScore: 0,
        adminFlag: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Video Submitted!',
        description: 'Your video is being processed and will be live shortly.',
      });
      form.reset();
      router.push('/');

    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Combined loading state
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check permissions only after loading is complete
  if (!user || userProfile?.role !== 'artist') {
    return (
       <div className="flex flex-1 items-center justify-center h-full">
        <Card className="w-[380px] text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
              <PlusSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline">Submit Video</CardTitle>
            <CardDescription>
              This feature is available for artists only. Please ensure you have an artist profile to submit videos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <PlusSquare /> Submit Your Video
          </CardTitle>
          <CardDescription>
            Share your talent with the world. Paste a video link to get started.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rawVideoInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., https://www.youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell everyone what your video is about..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="videoCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="acting">Acting</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Video
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
