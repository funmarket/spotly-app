'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Store,
  Bookmark,
  PlusSquare,
  MessageSquare,
  User,
  Clapperboard,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/marketplace', label: 'Market', icon: Store },
  { href: '/favorites', label: 'Saved', icon: Bookmark },
  { href: '/submit-video', label: 'Upload', icon: PlusSquare },
  { href: '/gossip', label: 'Gossip', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: Users },
];

const NavItem = ({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) => {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
  const { user } = useUser();

  let finalHref = href;
  if (label === 'Profile') {
    finalHref = user ? `/profile/${user.uid}` : '/'; // Fallback to home if no user
  }

  return (
    <Link href={finalHref} legacyBehavior>
      <a
        className={cn(
          'flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary',
          isActive && 'text-primary'
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </a>
    </Link>
  );
};

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border z-50 md:hidden">
      <div className="container mx-auto h-full">
        <div className="grid h-full grid-cols-6 items-center">
            <NavItem href="/" label="Home" icon={Home} />
            <NavItem href="/marketplace" label="Market" icon={Store} />
            <NavItem href="/favorites" label="Saved" icon={Bookmark} />
            <NavItem href="/submit-video" label="Upload" icon={Clapperboard} />
            <NavItem href="/gossip" label="Gossip" icon={MessageSquare} />
            <NavItem href="/profile" label="Profile" icon={Users} />
        </div>
      </div>
    </nav>
  );
}
