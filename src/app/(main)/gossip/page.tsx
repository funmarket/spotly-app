import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function GossipPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Gossip Feed</CardTitle>
          <CardDescription>The community social feed is under construction. Get ready to connect and share!</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
