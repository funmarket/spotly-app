'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Upload,
  Inbox,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/submit-video', label: 'Upload', icon: Upload },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/profile', label: 'Profile', icon: User },
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
  const { user } = useFirebase();

  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
  
  let finalHref = href;
  if (label === 'Profile') {
    finalHref = user ? `/profile/${user.uid}` : '/onboarding';
  }


  return (
    <Link
      href={finalHref}
      className={cn(
        'flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary',
        isActive && 'text-primary'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border z-50 md:hidden">
      <div className="container mx-auto h-full">
        <div className="grid h-full grid-cols-5 items-center">
            {navItems.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      </div>
    </nav>
  );
}
