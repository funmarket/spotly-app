'use client';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { notFound, useRouter } from 'next/navigation';
import type { MarketplaceProduct, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ShoppingCart, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

const LoadingSkeleton = () => (
  <div className="container mx-auto p-4 sm:p-6 lg:p-8">
    <Skeleton className="h-8 w-32 mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <div>
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { productId } = params;
  const firestore = useFirestore();
  const router = useRouter();
  const { user: currentUser } = useUser();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'marketplace_products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading: isProductLoading } = useDoc<MarketplaceProduct>(productRef);

  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !product?.sellerId) return null;
    return doc(firestore, 'users', product.sellerId);
  }, [firestore, product?.sellerId]);

  const { data: seller, isLoading: isSellerLoading } = useDoc<User>(sellerRef);

  if (isProductLoading || isSellerLoading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    notFound();
  }

  const handlePurchase = () => {
    // Placeholder for purchase logic
    alert(`Purchasing "${product.name}" is not yet implemented.`);
  };

  const isOwnProduct = currentUser?.uid === product.sellerId;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square relative w-full">
              <Image
                src={product.imageUrl || 'https://picsum.photos/seed/product-detail/600'}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col">
          <h1 className="text-4xl font-headline mb-4">{product.name}</h1>
          <p className="text-4xl font-bold text-primary mb-6">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
             <h3 className="font-semibold text-lg mb-2">Description</h3>
             <p className="text-muted-foreground">{product.description}</p>
          </div>

          {seller && (
             <Card className="mb-6 bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserIcon/>
                        Seller Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={seller.profilePhotoUrl} alt={seller.username}/>
                        <AvatarFallback>{seller.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{seller.username}</p>
                        <Link href={`/profile/${seller.walletAddress}`} className="text-sm text-primary hover:underline">
                            View Profile
                        </Link>
                    </div>
                </CardContent>
            </Card>
          )}

          <div className="mt-auto">
            <Button size="lg" className="w-full" onClick={handlePurchase} disabled={isOwnProduct}>
              <ShoppingCart className="mr-2" />
              {isOwnProduct ? "This is your product" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
