'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InboxRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/gossip?tab=inbox');
    }, [router]);
    
    return (
        <div className="flex flex-1 items-center justify-center h-full">
            <p>Redirecting to your inbox...</p>
        </div>
    );
}
