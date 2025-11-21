import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <SidebarInset className="p-0 m-0 rounded-none shadow-none bg-transparent">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
