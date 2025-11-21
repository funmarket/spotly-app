'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InboxPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/gossip?openConversationWith=true');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Redirecting to your inbox...</p>
        </div>
    );
}
