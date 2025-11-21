import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Favorites</CardTitle>
          <CardDescription>Your saved videos and products will appear here. This feature is coming soon!</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
