'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { MarketplaceProduct } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Store, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const firestore = useFirestore();
  const router = useRouter();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'marketplace_products'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: allProducts, isLoading } = useCollection<MarketplaceProduct>(productsQuery);

  const products = useMemo(() => {
    if (!allProducts) return [];
    // Client-side filtering
    return allProducts.filter(p => p.status === 'active');
  }, [allProducts]);

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
              <CardTitle className="font-headline text-2xl">Marketplace is Empty</CardTitle>
              <CardContent className="pt-4">
                <p className="text-muted-foreground mb-6">Check back later for products from talented artists.</p>
                <Button onClick={() => router.push('/marketplace/new')}>
                  Be the First to List an Item
                </Button>
              </CardContent>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
