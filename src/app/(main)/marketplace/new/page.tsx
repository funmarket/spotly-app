'use client';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusSquare, Loader2, DollarSign, List, FileText, Type } from 'lucide-react';
import { useDevapp } from '@/hooks/use-devapp';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const CATEGORY_OPTIONS = {
  music: ['Instruments', 'DJ Gear', 'Studio Gear', 'Outfits/Stagewear', 'Music (Digital)', 'CDs', 'Vinyl', 'Vintage Gear', 'Accessories', 'Other'],
  acting: ['Costumes', 'Props', 'Scripts', 'Coaching Sessions', 'Audition Services', 'Acting Classes', 'Tickets', 'Other'],
  creator: ['Painting', 'Graffiti', 'Digital Art', 'Sculpture', 'Design', 'Fashion', 'Photography', 'Handmade', 'Prints', 'Other'],
  merch: ['Clothing', 'Posters', 'Accessories', 'Other'],
  other: [],
};

const productSchema = z.object({
  name: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  price: z.coerce.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Please enter a valid image URL.').optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewListingPage() {
  const { userWallet, supabase } = useDevapp();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      imageUrl: '',
      category: '',
      subcategory: '',
    },
  });

  const category = form.watch('category');

  async function onSubmit(values: ProductFormValues) {
    if (!userWallet || !supabase) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a listing.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await supabase.from('marketplace_products').insert({
        seller_id: userWallet,
        name: values.name,
        description: values.description,
        price: values.price,
        image_url: values.imageUrl || `https://picsum.photos/seed/${Math.random()}/400`,
        category: values.category,
        subcategory: values.subcategory || '',
        status: 'active',
        stock: 1, // Defaulting stock to 1
      });
      toast({ title: 'Success!', description: 'Your product has been listed.' });
      router.push('/marketplace');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create listing.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <PlusSquare /> Create New Listing
          </CardTitle>
          <CardDescription>Fill out the details below to sell your item on the marketplace.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., 'Vintage Acoustic Guitar'" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                     <Textarea placeholder="Describe your item in detail..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (in USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.01" placeholder="25.00" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                   <Select onValueChange={(value) => { field.onChange(value); form.setValue('subcategory', ''); }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="acting">Acting</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="merch">Merchandise</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )} />
               {category && CATEGORY_OPTIONS[category as keyof typeof CATEGORY_OPTIONS]?.length > 0 && (
                 <FormField control={form.control} name="subcategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subcategory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS[category as keyof typeof CATEGORY_OPTIONS].map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )} />
               )}
               <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                    Create Listing
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    