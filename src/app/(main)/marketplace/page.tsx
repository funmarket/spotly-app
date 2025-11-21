'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Store } from 'lucide-react';

// Mock product type for now
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sellerId: string;
}

const ProductCard = ({ product }: { product: Product }) => (
  <Card>
    <CardContent className="p-0">
      <div className="aspect-square relative w-full">
        <Image 
            src={product.imageUrl} 
            alt={product.name} 
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint="product image"
        />
      </div>
    </CardContent>
    <CardHeader className="p-4">
        <CardTitle className="text-lg truncate">{product.name}</CardTitle>
    </CardHeader>
    <CardFooter className="flex justify-between items-center p-4 pt-0">
      <p className="font-bold text-primary text-xl">${product.price.toFixed(2)}</p>
      <Button size="sm">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>
    </CardFooter>
  </Card>
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
    // Note: This is still using a placeholder. In a real implementation, 
    // we would fetch products from a 'marketplace_products' collection.
    const isLoading = false;
    const products: Product[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `prod_${i}`,
        name: `Talent-Made Item #${i + 1}`,
        price: 29.99 + i * 5,
        imageUrl: `https://picsum.photos/seed/product${i}/400/400`,
        sellerId: `artist_${i}`
    }));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
            <h1 className="text-4xl font-headline flex items-center gap-3">
                <Store className="h-10 w-10" />
                Marketplace
            </h1>
            <p className="text-muted-foreground mt-2">Discover exclusive products and services from TalentVerse artists.</p>
        </div>
        <Button>List an Item</Button>
      </div>
      
      {isLoading ? <LoadingSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </div>
  );
}
