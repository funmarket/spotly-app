'use client';
import { useDevapp } from '@/hooks/use-devapp';
import { notFound, useRouter } from 'next/navigation';
import type { MarketplaceProduct, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ShoppingCart, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  const router = useRouter();
  const { supabase, userWallet: currentUserWallet } = useDevapp();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const { data: productData, error: productError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (productError || !productData) {
        setIsLoading(false);
        notFound();
        return;
      }
      setProduct(productData as MarketplaceProduct);

      if (productData.seller_id) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', productData.seller_id)
          .single();
        if (sellerData) {
          setSeller(sellerData as User);
        }
      }
      setIsLoading(false);
    }
    fetchProduct();
  }, [supabase, productId]);


  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    notFound();
  }

  const handlePurchase = () => {
    // Placeholder for purchase logic
    alert(`Purchasing "${product.name}" is not yet implemented.`);
  };

  const isOwnProduct = currentUserWallet === product.sellerId;

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

    