'use client';
import { useState, useEffect, useMemo } from 'react';
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
import { PlusSquare, Loader2, AlertCircle } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { parseVideoUrl } from '@/lib/video-parser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const videoSchema = z.object({
  rawVideoInput: z.string().min(1, { message: 'Please enter a video URL or embed code.' }),
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
    mode: 'onBlur',
    defaultValues: {
      rawVideoInput: '',
      description: '',
      videoCategory: '',
    },
  });

  const rawVideoInput = form.watch('rawVideoInput');
  const videoParseResult = useMemo(() => parseVideoUrl(rawVideoInput), [rawVideoInput]);

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

    const finalParseResult = parseVideoUrl(values.rawVideoInput);
    if (finalParseResult.error || !finalParseResult.embedUrl) {
      form.setError('rawVideoInput', { type: 'manual', message: finalParseResult.error });
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
        videoUrl: finalParseResult.embedUrl,
        status: 'active', // Changed from 'pending' to 'active' for immediate visibility
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
        description: 'Your video is now live.',
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

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || userProfile?.role !== 'artist') {
    return (
      <div className="flex flex-1 items-center justify-center h-full p-4">
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
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <PlusSquare /> Submit Your Video
          </CardTitle>
          <CardDescription>
            Share your talent. Paste a YouTube link or embed code to get started.
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
                    <FormLabel>YouTube URL or Embed Code</FormLabel>
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

              {rawVideoInput && (
                <div className="rounded-lg overflow-hidden border">
                  {videoParseResult.embedUrl ? (
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        key={videoParseResult.embedUrl}
                        src={videoParseResult.embedUrl}
                        title="Video Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : videoParseResult.error ? (
                     <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Parsing Error</AlertTitle>
                      <AlertDescription>{videoParseResult.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="aspect-video w-full bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Paste a link to see a preview</p>
                    </div>
                  )}
                </div>
              )}

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
              <Button type="submit" disabled={isSubmitting || !!videoParseResult.error} className="w-full">
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
