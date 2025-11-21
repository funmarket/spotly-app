import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Marketplace</CardTitle>
          <CardDescription>A space for artists and businesses to trade services and products is coming soon.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
