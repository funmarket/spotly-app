'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { addDoc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { User, GossipPost } from '@/lib/types';
import { getUser } from '@/lib/data';

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(280, 'Post is too long'),
});

function PostCard({ post }: { post: GossipPost & { id: string } }) {
  // In a real app, you would fetch the user from Firestore using the authorId
  // For now, we'll use the mock data.
  const author = getUser(post.authorId);

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true })
    : 'just now';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={author?.profilePhotoUrl} />
            <AvatarFallback>{author?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{author?.username}</p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostComposer() {
  const { firestore, user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  async function onSubmit(values: z.infer<typeof postSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);
    try {
      const postsCollection = collection(firestore, 'gossip_posts');
      await addDoc(postsCollection, {
        authorId: user.uid,
        content: values.content,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      form.reset();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="What's on your mind?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Post
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function GossipPage() {
  const { firestore, isUserLoading } = useFirebase();
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gossip_posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: posts, isLoading } = useCollection<GossipPost>(postsQuery);

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <h1 className="text-3xl font-headline">Gossip Feed</h1>
      <PostComposer />
      <div className="space-y-4">
        {isLoading || isUserLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          posts?.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
