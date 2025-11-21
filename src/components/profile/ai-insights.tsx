'use client';
import { useEffect, useState } from 'react';
import { generateArtistInsights } from '@/ai/flows/profile-ai-generated-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useDevapp } from '@/hooks/use-devapp';

type AiInsightsProps = {
  artistId: string;
};

export function AiInsights({ artistId }: AiInsightsProps) {
  const { userWallet } = useDevapp();
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if the current user is an admin
  const isAdmin = userWallet === 'ADMIN_WALLET_PLACEHOLDER';

  useEffect(() => {
    async function fetchInsights() {
      if (!userWallet) {
        setError("You must be logged in to view insights.");
        setLoading(false);
        return;
      }
      
      // Regular artists should not see admin insights.
      if (isAdmin) {
          setError("Admin insights should be viewed on the admin dashboard.");
          setLoading(false);
          return;
      }

      setLoading(true);
      setError(null);
      try {
        // In a real app, this data would be fetched from your database
        const input = {
          artistId: artistId,
          videoPerformanceData: 'Recent videos show a 20% increase in engagement. Peak viewership is on weekends.',
          votesData: 'Received 5,000 "Top" votes and 200 "Flop" votes in the last 7 days. Positive sentiment is high.',
          viewsData: 'Total views have crossed 1 million. Average view duration is 8 seconds on 10-second videos.',
          bookingData: 'Received 3 booking inquiries this month. 2 were for corporate events.',
        };
        const result = await generateArtistInsights(input);
        setInsights(result.insights);
      } catch (e) {
        console.error("Failed to generate AI insights:", e);
        setError("Could not load insights at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [artistId, userWallet, isAdmin]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            AI Generated Insights
          </CardTitle>
          <CardDescription>
            Analyzing your performance data to provide actionable advice...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
  }

  // Simple parsing of insights text into points
  const insightPoints = insights.split(/\d+\./).filter(p => p.trim() !== '');

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-primary" />
          AI Generated Insights
        </CardTitle>
        <CardDescription>
          Your personalized performance analysis and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {insightPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <Badge className="h-6 w-6 flex items-center justify-center shrink-0 mt-1 bg-primary text-primary-foreground">{index + 1}</Badge>
              <p className="text-foreground/90">{point.trim()}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
