'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  MessageSquare,
  Store,
  PlusSquare,
  Heart,
  Bell,
  User,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getUser } from '@/lib/data';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/gossip', label: 'Gossip', icon: MessageSquare },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/submit-video', label: 'Submit', icon: PlusSquare },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/referrals', label: 'Referrals', icon: Gift },
];

const Logo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      fill="currentColor"
    />
    <path d="M12 8l-6 4 6 4 6-4-6-4z" fill="currentColor" />
  </svg>
);

export function AppSidebar() {
  const pathname = usePathname();
  // In a real app, you'd get the current user from context/session
  const currentUser = getUser('wallet_fan_1'); 

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-headline text-2xl font-semibold text-primary">
              TalentVerse
            </span>
          </Link>
        </SidebarHeader>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.href === '/'
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                }
                tooltip={{ children: item.label, side: 'right' }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {currentUser && (
           <SidebarMenuButton asChild tooltip={{ children: 'Profile', side: 'right' }}>
            <Link href={`/profile/${currentUser.userId}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.profilePhotoUrl} alt={currentUser.username} />
                <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{currentUser.username}</span>
            </Link>
            </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
