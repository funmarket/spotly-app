'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const TALENT_CATEGORIES = {
  music: {
    label: 'Music',
    subcategories: [
      { value: 'singer', label: 'Singer' },
      { value: 'dj', label: 'DJ' },
      { value: 'dancer', label: 'Dancer' },
      { value: 'solo_instrumentalist', label: 'Solo Instrumentalist' },
      { value: 'band', label: 'Band' },
      { value: 'producer', label: 'Producer' },
      { value: 'rapper', label: 'Rapper' },
      { value: 'songwriter', label: 'Songwriter' },
      { value: 'electronic', label: 'Electronic' },
    ],
  },
  acting: {
    label: 'Acting',
    subcategories: [
      { value: 'actor_film_tv', label: 'Film/TV Actor' },
      { value: 'theatre', label: 'Theatre' },
      { value: 'standup_comedy', label: 'Standup Comedy' },
      { value: 'skits_shortform', label: 'Skits/Short-form' },
      { value: 'improv', label: 'Improv' },
      { value: 'voice_actor', label: 'Voice Actor' },
      { value: 'jokes', label: 'Jokes' },
    ],
  },
  creator: {
    label: 'Creator',
    subcategories: [
      { value: 'painting', label: 'Painting' },
      { value: 'graffiti', label: 'Graffiti' },
      { value: 'digital_art', label: 'Digital Art' },
      { value: 'sculpture', label: 'Sculpture' },
      { value: 'design', label: 'Design' },
      { value: 'fashion', label: 'Fashion' },
      { value: 'photography', label: 'Photography' },
      { value: 'handmade', label: 'Handmade' },
      { value: 'mixed_media', label: 'Mixed Media' },
    ],
  },
};

const profileSchema = z.object({
  username: z.string().min(1, 'Username is required').max(30, 'Username must be 30 characters or less'),
  bio: z.string().max(280, 'Bio must be 280 characters or less').optional(),
  profilePhotoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  bannerPhotoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  isArtist: z.boolean().default(false),
  isBusiness: z.boolean().default(false),
  talentCategory: z.string().optional(),
  talentSubcategories: z.array(z.string()).optional(),
  subRole: z.string().optional(), // Legacy Talent Type
  tags: z.string().optional(),
  location: z.string().optional(),
  socialLinks: z.object({
    youtube: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    facebook: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  extraLinks: z.array(z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().url("Must be a valid URL"),
  })).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CreateProfilePage() {
  const { firestore } = useFirebase();
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const params = useParams();
  const accountType = params.role as string;
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExtraLinks, setShowExtraLinks] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      profilePhotoUrl: '',
      bannerPhotoUrl: '',
      isArtist: accountType === 'artist',
      isBusiness: accountType === 'business',
      talentCategory: '',
      talentSubcategories: [],
      subRole: '',
      tags: '',
      location: '',
      socialLinks: { youtube: '', twitter: '', instagram: '', tiktok: '', facebook: '', telegram: '', website: '' },
      extraLinks: [],
    },
  });
  
  useEffect(() => {
    if(accountType === 'fan') {
      form.setValue('isArtist', false);
      form.setValue('isBusiness', false);
    } else if(accountType === 'artist') {
      form.setValue('isArtist', true);
      form.setValue('isBusiness', false);
    } else if(accountType === 'business') {
      form.setValue('isBusiness', true);
      form.setValue('isArtist', false);
    }
  }, [accountType, form]);

  const { watch, setValue } = form;
  const isArtist = watch('isArtist');
  const talentCategory = watch('talentCategory');
  
  const onSubmit = async (values: ProfileFormValues) => {
    if (!firestore) return;
    
    const needsWallet = accountType === 'artist' || accountType === 'business';

    if (needsWallet && !publicKey) {
        alert("A wallet connection is required to create this profile type.");
        return;
    }
    if (!values.username) {
        alert("Username is required");
        return;
    }
    if (accountType !== 'fan' && !values.isArtist && !values.isBusiness) {
        alert("Please select an account type (Artist or Business).");
        return;
    }
    if (values.isArtist && !values.talentCategory) {
        alert("Please select a talent category for artists.");
        return;
    }

    setIsSubmitting(true);
    try {
        let role: 'fan' | 'artist' | 'business' = 'fan'; // Default to fan
        if (values.isArtist) role = 'artist';
        else if (values.isBusiness) role = 'business';

        // For fans without a wallet, generate a unique ID.
        // For artists/businesses, the wallet public key is the ID.
        const docId = publicKey ? publicKey.toBase58() : doc(collection(firestore, 'users')).id;
        const userDocRef = doc(firestore, 'users', docId);

        const sanitizeUrl = (url?: string) => {
            if (!url) return '';
            const trimmedUrl = url.trim();
            try {
                const urlObj = new URL(trimmedUrl);
                if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                    return ''; // Reject non-http(s) protocols
                }
                return trimmedUrl;
            } catch (error) {
                return ''; // Invalid URL format
            }
        }
        
        await setDoc(userDocRef, {
            walletAddress: publicKey ? publicKey.toBase58() : docId,
            username: values.username,
            bio: values.bio || '',
            role: role,
            profilePhotoUrl: sanitizeUrl(values.profilePhotoUrl) || `https://picsum.photos/seed/${docId}/400`,
            bannerPhotoUrl: sanitizeUrl(values.bannerPhotoUrl) || `https://picsum.photos/seed/banner-${docId}/1200/400`,
            talentCategory: values.isArtist ? values.talentCategory : null,
            talentSubcategories: values.isArtist ? JSON.stringify(values.talentSubcategories || []) : '[]',
            subRole: values.isArtist ? values.subRole : null,
            tags: values.tags || '',
            skills: '',
            location: values.location || '',
            socialLinks: JSON.stringify(values.socialLinks || {}),
            extraLinks: JSON.stringify(values.extraLinks || []),
            rankingScore: 0,
            escrowBalance: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
        
        if (role === 'artist') {
            setStep(2);
        } else {
            router.push('/');
        }
    } catch (error) {
        console.error("Error creating profile:", error);
        alert("Failed to create profile. Please check the console for details.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const addExtraLink = () => {
    const currentLinks = form.getValues('extraLinks') || [];
    if(currentLinks.length < 5) {
        setValue('extraLinks', [...currentLinks, { label: '', url: '' }]);
    }
  };

  const removeExtraLink = (index: number) => {
    const currentLinks = form.getValues('extraLinks') || [];
    setValue('extraLinks', currentLinks.filter((_, i) => i !== index));
  };
  
  const handleTalentSubcategorySelect = (subcategory: string) => {
      const currentSubs = form.getValues('talentSubcategories') || [];
      const newSubs = currentSubs.includes(subcategory)
        ? currentSubs.filter(s => s !== subcategory)
        : [...currentSubs, subcategory];
      setValue('talentSubcategories', newSubs);
  }

  // Wallet Connection Check for Artist/Business
  if ((accountType === 'artist' || accountType === 'business') && !connected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Connect Your Wallet</CardTitle>
            <CardDescription>A Solana wallet is required to create an {accountType} profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletMultiButton />
          </CardContent>
           <CardFooter className="justify-center">
                <Button variant="link" onClick={() => router.push('/onboarding')}>
                    Choose a different role
                </Button>
           </CardFooter>
        </Card>
      </div>
    );
  }

  const PageTitle = {
      fan: "Create Fan Profile",
      artist: "Create Artist/Talent Profile",
      business: "Create Business Profile"
  }[accountType] || "Create Profile";

  const PageDescription = {
      fan: "Become a Fan — It's Free!",
      artist: "Showcase your talent to the world",
      business: "Discover and hire amazing talent"
  }[accountType] || "Tell us about yourself";

  // Step 2 for artists
  if (step === 2) {
      return (
          <div className="flex min-h-screen items-center justify-center p-4">
              <Card className="w-full max-w-md text-center">
                  <CardHeader>
                      <CardTitle className="font-headline text-3xl">Profile Created!</CardTitle>
                      <CardDescription>You can now upload your first video to get discovered.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="w-full" onClick={() => router.push('/')}>Browse Feed</Button>
                      <Button className="w-full" onClick={() => router.push('/submit-video')}>Upload Video</Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  // Step 1: Profile creation form
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{PageTitle}</CardTitle>
          <CardDescription>{PageDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                
                {accountType !== 'fan' && (
                    <FormItem>
                        <FormLabel>Account Type*</FormLabel>
                        <div className="space-y-3 rounded-lg border bg-background p-4">
                            <FormField
                                control={form.control}
                                name="isArtist"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if(checked) setValue('isBusiness', false);
                                    }} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                    <FormLabel>Artist / Talent</FormLabel>
                                    <FormDescription>
                                        Showcase your talent and get discovered.
                                    </FormDescription>
                                    </div>
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="isBusiness"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if(checked) setValue('isArtist', false);
                                    }} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                    <FormLabel>Business / Producer</FormLabel>
                                    <FormDescription>
                                        Discover and hire talent.
                                    </FormDescription>
                                    </div>
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormMessage>{form.formState.errors.isArtist?.message}</FormMessage>
                    </FormItem>
                )}

              <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username*</FormLabel>
                    <FormControl><Input placeholder="Your stage name or username" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>

              <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell us a bit about yourself..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              
              <FormField control={form.control} name="profilePhotoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Photo URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/your-photo.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              
              <FormField control={form.control} name="bannerPhotoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Photo URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/your-banner.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              
            {isArtist && (
                <>
                <FormField control={form.control} name="talentCategory"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Talent Category*</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            setValue('talentSubcategories', []);
                        }} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a talent category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="music">Music</SelectItem>
                            <SelectItem value="acting">Acting</SelectItem>
                            <SelectItem value="creator">Creator</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>

                {talentCategory && TALENT_CATEGORIES[talentCategory as keyof typeof TALENT_CATEGORIES]?.subcategories.length > 0 && (
                    <FormField control={form.control} name="talentSubcategories"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subcategories (select multiple)</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {TALENT_CATEGORIES[talentCategory as keyof typeof TALENT_CATEGORIES]?.subcategories.map(sub => (
                                    <Button key={sub.value} type="button" 
                                        variant={field.value?.includes(sub.value) ? 'default' : 'secondary'}
                                        onClick={() => handleTalentSubcategorySelect(sub.value)}
                                        >{sub.label}</Button>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                )}
                 
                <FormField control={form.control} name="subRole" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Legacy Talent Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a legacy talent type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="singer">Singer</SelectItem>
                            <SelectItem value="actor">Actor</SelectItem>
                            <SelectItem value="dancer">Dancer</SelectItem>
                            <SelectItem value="painter">Painter</SelectItem>
                            <SelectItem value="standup">Standup</SelectItem>
                            <SelectItem value="theatre">Theatre</SelectItem>
                            <SelectItem value="cinema">Cinema</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormDescription>This is a legacy field, you can select an option if it applies.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl><Input placeholder="pop, hiphop, indie (comma separated)" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl><Input placeholder="City, Country" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <h3 className="font-medium">Social Media Links</h3>
                   <FormField control={form.control} name="socialLinks.youtube" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="YouTube URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.twitter" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Twitter/X URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.instagram" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Instagram URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.tiktok" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="TikTok URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.facebook" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Facebook URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.telegram" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Telegram URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                   <FormField control={form.control} name="socialLinks.website" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Website/Portfolio URL" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                   )}/>
                </div>

                <div className="space-y-4 rounded-lg border bg-background p-4">
                    <Button type="button" variant="ghost" onClick={() => setShowExtraLinks(!showExtraLinks)} className="flex items-center gap-2 px-0 text-accent-foreground hover:text-accent-foreground">
                        {showExtraLinks ? <ChevronUp /> : <ChevronDown />}
                        Additional Links (Optional, Max 5)
                    </Button>
                    {showExtraLinks && (
                        <>
                        {form.watch('extraLinks')?.map((_, index) => (
                           <div key={index} className="flex items-start gap-2">
                             <FormField
                                control={form.control}
                                name={`extraLinks.${index}.label`}
                                render={({ field }) => <FormItem className="flex-1"><FormControl><Input placeholder="Label" {...field} /></FormControl><FormMessage /></FormItem>}
                              />
                             <FormField
                                control={form.control}
                                name={`extraLinks.${index}.url`}
                                render={({ field }) => <FormItem className="flex-1"><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>}
                              />
                             <Button type="button" variant="destructive" size="icon" onClick={() => removeExtraLink(index)}><Trash2/></Button>
                           </div>
                        ))}
                         {(!form.watch('extraLinks') || form.watch('extraLinks')!.length < 5) && (
                            <Button type="button" variant="outline" onClick={addExtraLink}><Plus className="mr-2"/> Add Link</Button>
                         )}
                        </>
                    )}
                </div>
                </>
            )}

            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Back</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                {isArtist && accountType === 'artist' ? 'Continue' : 'Create Profile'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
