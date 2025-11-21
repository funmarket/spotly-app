import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusSquare } from "lucide-react";

export default function SubmitVideoPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <PlusSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline">Submit Video</CardTitle>
          <CardDescription>The video submission portal for artists is currently being developed. Stay tuned!</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
