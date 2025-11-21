import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Notifications</CardTitle>
          <CardDescription>Stay updated with real-time alerts. This feature will be available soon.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
