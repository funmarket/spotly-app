'use client';
import { useEffect, useState } from 'react';
import { generateAdminInsights } from '@/ai/flows/admin-ai-generated-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';

export function AdminAiInsights() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      setError(null);
      try {
        const result = await generateAdminInsights({});
        setInsights(result.insights);
      } catch (e) {
        console.error("Failed to generate admin AI insights:", e);
        setError("Could not load admin insights. This may be a permission issue or a server error.");
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-primary" />
            Admin AI Insights
          </CardTitle>
          <CardDescription>
            Analyzing platform-wide data to generate strategic advice...
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
          <Wand2 className="h-4 w-4" />
          <AlertTitle>Error Generating Insights</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    )
  }

  // Simple parsing of insights text into points. This can be improved.
  const insightPoints = insights.split('*').map(s => s.trim()).filter(p => p.length > 0);

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Shield className="text-primary" />
          Admin AI Insights
        </CardTitle>
        <CardDescription>
          A high-level overview of platform activity and trends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {insightPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1">
                 <Wand2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-foreground/90">{point}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
