'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDevapp } from '@/hooks/use-devapp';
import { addDoc, collection, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, increment } from 'firebase/firestore';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Star, MessageCircle, RefreshCw, Sparkles, User, Briefcase, Handshake, LogOut, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { User as AppUser, GossipPost, GossipComment, GossipRating, GossipMessage } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(1000, 'Post is too long'),
  category: z.string().default('General'),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

function StarRating({ postId, currentRating, ratingCount, onRate }: { postId: string, currentRating: number, ratingCount: number, onRate: ((postId: string, score: number) => void) | null }) {
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleRate = (score: number) => {
        if (onRate) {
            onRate(postId, score);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => handleRate(star)}
                        className="transition-all"
                        disabled={!onRate}
                    >
                        <Star size={18} fill={star <= (hoveredStar || currentRating) ? '#FFD700' : 'none'} stroke={star <= (hoveredStar || currentRating) ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'} />
                    </button>
                ))}
            </div>
            {ratingCount > 0 && (
                <span className="text-gray-400 text-xs ml-1">
                    ({currentRating.toFixed(1)} · {ratingCount})
                </span>
            )}
        </div>
    );
}

function CommentsSection({ postId, currentUser }: { postId: string, currentUser: AppUser | null }) {
    const { firestore } = useDevapp();
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'gossip_comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    }, [firestore, postId]);
    
    const { data: comments, isLoading } = useCollection<GossipComment>(commentsQuery);

    if (isLoading) {
        return <Skeleton className="h-16 w-full" />
    }

    return (
        <div className="space-y-2">
            {comments?.map(comment => (
                <CommentCard key={comment.id} comment={comment as GossipComment & { id:string }} currentUser={currentUser} />
            ))}
        </div>
    )
}

function CommentCard({ comment, currentUser }: { comment: GossipComment & {id: string}, currentUser: AppUser | null }) {
    const { firestore } = useDevapp();
    const authorDocRef = useMemoFirebase(() => {
        if (!firestore || !comment.authorId) return null;
        return doc(firestore, 'users', comment.authorId);
    }, [firestore, comment.authorId]);
    const { data: author } = useDoc<AppUser>(authorDocRef);

    const handleDelete = async () => {
        if (!firestore || !window.confirm('Delete this comment?')) return;
        try {
            await deleteDoc(doc(firestore, 'gossip_comments', comment.id));
            const postRef = doc(firestore, 'gossip_posts', comment.postId);
            await updateDoc(postRef, { commentsCount: increment(-1) });
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    }

    return (
        <Card className="bg-background/50">
            <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={author?.profilePhotoUrl} />
                        <AvatarFallback>{author?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{author?.username}</p>
                                <p className="text-xs text-muted-foreground">
                                    {comment.createdAt ? formatDistanceToNow(new Date((comment.createdAt as any).seconds * 1000), { addSuffix: true }) : 'just now'}
                                </p>
                            </div>
                             {currentUser?.walletAddress === comment.authorId && (
                                <Button variant="ghost" size="sm" onClick={handleDelete}>Delete</Button>
                             )}
                        </div>
                        <p className="mt-1 text-sm">{comment.content}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function PostCard({ post }: { post: GossipPost & { id: string } }) {
  const { firestore, userWallet } = useDevapp();
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");

  const authorDocRef = useMemoFirebase(() => {
    if (!firestore || !post.authorId) return null;
    return doc(firestore, 'users', post.authorId);
  }, [firestore, post.authorId]);
  
  const { data: author } = useDoc<AppUser>(authorDocRef);

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date((post.createdAt as any).seconds * 1000), { addSuffix: true })
    : 'just now';

  const handleCommentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firestore || !userWallet || !comment.trim()) return;

      try {
          await addDoc(collection(firestore, 'gossip_comments'), {
              postId: post.id,
              authorId: userWallet,
              content: comment,
              createdAt: serverTimestamp(),
          });
          const postRef = doc(firestore, 'gossip_posts', post.id);
          await updateDoc(postRef, { commentsCount: increment(1) });
          setComment("");
      } catch (error) {
          console.error("Error adding comment: ", error);
      }
  }

  const handleRate = async (postId: string, score: number) => {
      if (!firestore || !userWallet) return;
      try {
          await addDoc(collection(firestore, 'gossip_ratings'), {
              postId,
              raterId: userWallet,
              rating: score,
          });
      } catch (error) {
          console.error("Error submitting rating: ", error);
      }
  };

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
            {post.imageUrl && <img src={post.imageUrl} alt="Gossip post" className="mt-2 rounded-lg" />}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 border-t pt-2">
            <StarRating postId={post.id} currentRating={post.avgRating || 0} ratingCount={post.ratingCount || 0} onRate={userWallet ? handleRate : null} />
            <Button variant="ghost" onClick={() => setExpanded(!expanded)}>
                Comments ({post.commentsCount || 0})
            </Button>
        </div>
        {expanded && (
            <div className="mt-4">
                {userWallet && (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
                        <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
                        <Button type="submit" disabled={!comment.trim()}>Post</Button>
                    </form>
                )}
                <CommentsSection postId={post.id} currentUser={{ walletAddress: userWallet } as AppUser | null} />
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function PostComposer() {
  const { firestore, userWallet } = useDevapp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '', imageUrl: '', category: 'General' },
  });

  async function onSubmit(values: z.infer<typeof postSchema>) {
    if (!firestore || !userWallet) return;
    setIsSubmitting(true);
    try {
      const postsCollection = collection(firestore, 'gossip_posts');
      await addDoc(postsCollection, {
        authorId: userWallet,
        content: values.content,
        category: values.category,
        imageUrl: values.imageUrl || '',
        commentsCount: 0,
        createdAt: serverTimestamp(),
        avgRating: 0,
        ratingCount: 0,
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
         <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Image URL (optional)" {...field} />
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

function GossipFeed() {
    const { firestore } = useDevapp();
    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'gossip_posts'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: posts, isLoading } = useCollection<GossipPost>(postsQuery);

    return (
        <div>
            <PostComposer />
            <div className="space-y-4 mt-6">
                {isLoading ? (
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
    )
}

function GossipInbox({ initialSelectedWallet }: { initialSelectedWallet: string | null }) {
    const { firestore, userWallet } = useDevapp();
    const [conversations, setConversations] = useState<AppUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [messages, setMessages] = useState<(GossipMessage & { id: string })[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if(userWallet && firestore) {
                const userDoc = await getDoc(doc(firestore, 'users', userWallet));
                if(userDoc.exists()){
                    setCurrentUser(userDoc.data() as AppUser);
                }
            }
        }
        fetchCurrentUser();
    }, [userWallet, firestore]);

    useEffect(() => {
        if (!userWallet) return;
        loadConversations();
    }, [userWallet]);

    useEffect(() => {
        if (initialSelectedWallet && conversations.length > 0) {
            const userToSelect = conversations.find(u => u.walletAddress === initialSelectedWallet);
            if (userToSelect) {
                handleSelectUser(userToSelect);
            }
        }
    }, [initialSelectedWallet, conversations]);
     
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        if (!firestore || !userWallet) return;
        setLoading(true);
        const sentMessagesQuery = query(collection(firestore, 'gossip_messages'), where('fromId', '==', userWallet));
        const receivedMessagesQuery = query(collection(firestore, 'gossip_messages'), where('toId', '==', userWallet));

        const [sentSnapshot, receivedSnapshot] = await Promise.all([getDocs(sentMessagesQuery), getDocs(receivedMessagesQuery)]);
        const userIds = new Set<string>();
        sentSnapshot.forEach(doc => userIds.add(doc.data().toId));
        receivedSnapshot.forEach(doc => userIds.add(doc.data().fromId));

        if (initialSelectedWallet) {
            userIds.add(initialSelectedWallet);
        }

        if (userIds.size === 0) {
            setLoading(false);
            return;
        }
        
        const usersQuery = query(collection(firestore, 'users'), where('walletAddress', 'in', Array.from(userIds)));
        const usersSnapshot = await getDocs(usersQuery);
        const convUsers = usersSnapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as AppUser));

        setConversations(convUsers);
        setLoading(false);
    };

    const handleSelectUser = (user: AppUser) => {
        setSelectedUser(user);
    };

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !userWallet || !selectedUser) return null;
        return query(collection(firestore, 'gossip_messages'), where('fromId', 'in', [userWallet, selectedUser.walletAddress]), where('toId', 'in', [userWallet, selectedUser.walletAddress]), orderBy('createdAt', 'asc'));
    }, [firestore, userWallet, selectedUser]);
    
    const {data: allMessages} = useCollection<GossipMessage>(messagesQuery);
    
    useEffect(() => {
        if (allMessages) {
            const filtered = allMessages.filter(msg => 
                (msg.fromId === userWallet && msg.toId === selectedUser?.walletAddress) ||
                (msg.fromId === selectedUser?.walletAddress && msg.toId === userWallet)
            )
            setMessages(filtered);
        }
    }, [allMessages, userWallet, selectedUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !userWallet || !selectedUser || !messageText.trim()) return;

        try {
            await addDoc(collection(firestore, 'gossip_messages'), {
                fromId: userWallet,
                toId: selectedUser.walletAddress,
                content: messageText,
                createdAt: serverTimestamp(),
            });
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading...</p>
                    ) : conversations.length === 0 ? (
                        <p>No conversations yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map(convUser => (
                                <button key={convUser.walletAddress} onClick={() => handleSelectUser(convUser)} className={`w-full text-left p-2 rounded-lg ${selectedUser?.walletAddress === convUser.walletAddress ? 'bg-muted' : 'hover:bg-muted'}`}>
                                    <p className="font-semibold">{convUser.username}</p>
                                    <p className="text-xs text-muted-foreground truncate">{convUser.walletAddress}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="md:col-span-2 flex flex-col h-[60vh]">
                {selectedUser ? (
                    <>
                        <CardHeader>
                            <CardTitle>{selectedUser.username}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-4">
                             {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.fromId === userWallet ? 'justify-end' : 'justify-start'}`}>
                                    {msg.fromId !== userWallet && <Avatar className="h-6 w-6"><AvatarImage src={selectedUser.profilePhotoUrl} /><AvatarFallback>{selectedUser.username?.charAt(0)}</AvatarFallback></Avatar>}
                                    <p className={`max-w-[70%] p-3 rounded-lg ${msg.fromId === userWallet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{msg.content}</p>
                                </div>
                             ))}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <CardFooter>
                            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                                <Input value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." />
                                <Button type="submit">Send</Button>
                            </form>
                        </CardFooter>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation to start messaging.
                    </div>
                )}
            </Card>
        </div>
    );
}

export default function GossipPageContainer() {
    const { userWallet } = useDevapp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const openConversationWith = searchParams.get('openConversationWith');

    const [activeTab, setActiveTab] = useState('feed');
    
    useEffect(() => {
        if (openConversationWith) {
            setActiveTab('inbox');
        }
    }, [openConversationWith]);

    if (!userWallet) {
        return (
            <div className="flex flex-1 items-center justify-center h-full">
                <Card className="w-[380px] text-center">
                    <CardHeader>
                    <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
                        <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Gossip & Inbox</CardTitle>
                    <CardDescription>
                        Please log in to view the gossip feed and your messages.
                    </CardDescription>
                    <Button onClick={() => router.push('/onboarding')} className="mt-4">Login</Button>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
            <h1 className="text-3xl font-headline">Gossip</h1>
            <div className="border-b">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('feed')} className={`${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Feed
                    </button>
                    <button onClick={() => setActiveTab('inbox')} className={`${activeTab === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Inbox
                    </button>
                </nav>
            </div>
            {activeTab === 'feed' ? <GossipFeed /> : <GossipInbox initialSelectedWallet={openConversationWith} />}
        </div>
    );
}
