import { BottomNavBar } from '@/components/shared/bottom-nav-bar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full h-full">{children}</main>
      <BottomNavBar />
    </div>
  );
}
