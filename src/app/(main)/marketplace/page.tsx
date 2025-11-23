'use client';

import { useMemo, useState, useEffect } from 'react';
import type { MarketplaceProduct } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Store, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDevapp } from '@/hooks/use-devapp';

const CATEGORY_OPTIONS = {
  music: ['Instruments', 'DJ Gear', 'Studio Gear', 'Outfits/Stagewear', 'Music (Digital)', 'CDs', 'Vinyl', 'Vintage Gear', 'Accessories', 'Other'],
  acting: ['Costumes', 'Props', 'Scripts', 'Coaching Sessions', 'Audition Services', 'Acting Classes', 'Tickets', 'Other'],
  creator: ['Painting', 'Graffiti', 'Digital Art', 'Sculpture', 'Design', 'Fashion', 'Photography', 'Handmade', 'Prints', 'Other'],
  merch: ['Clothing', 'Posters', 'Accessories', 'Other'],
  other: [],
};


const ProductCard = ({ product }: { product: MarketplaceProduct }) => (
  <Link href={`/marketplace/${product.id}`} className="group">
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-0">
        <div className="aspect-square relative w-full">
          <Image
            src={product.imageUrl || 'https://picsum.photos/seed/product/400'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            data-ai-hint="product image"
          />
        </div>
      </CardContent>
      <CardHeader className="p-4 flex-1">
        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">{product.name}</CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-between items-center p-4 pt-0">
        <p className="font-bold text-primary text-xl">${product.price.toFixed(2)}</p>
        <Button size="sm" variant="secondary" asChild>
          <span className="cursor-pointer">
            <ShoppingCart className="mr-2 h-4 w-4" />
            View
          </span>
        </Button>
      </CardFooter>
    </Card>
  </Link>
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-0">
          <Skeleton className="aspect-square w-full rounded-t-lg" />
        </CardContent>
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardFooter className="flex justify-between items-center p-4 pt-0">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-10 w-2/5" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default function MarketplacePage() {
  const { supabase } = useDevapp();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt_desc');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const [sortField, sortDirection] = sortBy.split('_');
      
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order(sortField === 'createdAt' ? 'created_at' : sortField, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;
      
      if (data) {
        setAllProducts(data as MarketplaceProduct[]);
      }
      setIsLoading(false);
    }
    fetchProducts();
  }, [supabase, sortBy]);

  const products = useMemo(() => {
    if (!allProducts) return [];
    
    return allProducts.filter(p => {
      const statusMatch = p.status === 'active';
      const categoryMatch = activeCategory === 'all' || p.category === activeCategory;
      const subcategoryMatch = activeCategory === 'all' || activeSubcategory === 'all' || p.subcategory === activeSubcategory;
      return statusMatch && categoryMatch && subcategoryMatch;
    });

  }, [allProducts, activeCategory, activeSubcategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory('all');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-headline flex items-center gap-3">
            <Store className="h-10 w-10 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover exclusive products and services from TalentVerse artists.
          </p>
        </div>
        <Button onClick={() => router.push('/marketplace/new')}>
          <Plus className="mr-2" /> List an Item
        </Button>
      </div>
      
       <Card className="mb-8 p-4">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 space-y-4">
               <div className="text-sm font-medium">Categories</div>
               <div className="flex gap-2 flex-wrap">
                    <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('all')}>All</Button>
                    <Button variant={activeCategory === 'music' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('music')}>Music</Button>
                    <Button variant={activeCategory === 'acting' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('acting')}>Acting</Button>
                    <Button variant={activeCategory === 'creator' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('creator')}>Creator</Button>
                    <Button variant={activeCategory === 'merch' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('merch')}>Merch</Button>
                    <Button variant={activeCategory === 'other' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('other')}>Other</Button>
                </div>
            </div>
            <div className="md:w-px bg-border mx-4 hidden md:block"></div>
            <div className="md:max-w-xs">
                <div className="text-sm font-medium">Sort by</div>
                 <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt_desc">Newest</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </div>
        {activeCategory !== 'all' && CATEGORY_OPTIONS[activeCategory as keyof typeof CATEGORY_OPTIONS]?.length > 0 && (
          <>
            <div className="h-px bg-border my-4"></div>
            <div className="space-y-2">
                <div className="text-sm font-medium">Subcategories</div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant={activeSubcategory === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveSubcategory('all')}>All</Button>
                    {CATEGORY_OPTIONS[activeCategory as keyof typeof CATEGORY_OPTIONS].map(sub => (
                        <Button key={sub} variant={activeSubcategory === sub ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveSubcategory(sub)}>{sub}</Button>
                    ))}
                </div>
            </div>
          </>
        )}
      </Card>


      {isLoading ? (
        <LoadingSkeleton />
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <Card className="w-full text-center mt-8 py-12">
          <CardHeader>
              <div className="mx-auto bg-muted p-4 rounded-full mb-4 w-fit">
                  <Store className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="font-headline text-2xl">No Products Found</CardTitle>
              <CardContent className="pt-4">
                <p className="text-muted-foreground mb-6">Try adjusting your filters or check back later.</p>
                <Button onClick={() => { setActiveCategory('all'); setActiveSubcategory('all'); }}>
                  Clear Filters
                </Button>
              </CardContent>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

    