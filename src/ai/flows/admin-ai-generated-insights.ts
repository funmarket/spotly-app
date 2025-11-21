'use server';

/**
 * @fileOverview Generates AI insights for the admin dashboard based on platform-wide data.
 *
 * - generateAdminInsights - A function that generates insights for the admin dashboard.
 * - AdminInsightsInput - The input type for the generateAdminInsights function.
 * - AdminInsightsOutput - The return type for the generateAdminInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {collection, getDocs, query, where, orderBy, limit} from 'firebase/firestore';
import {getSdks} from '@/firebase';

const AdminInsightsInputSchema = z.object({}).describe("Input for generating admin insights. This is currently empty as the flow fetches all required data.");
export type AdminInsightsInput = z.infer<typeof AdminInsightsInputSchema>;

const AdminInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights for the admin dashboard.'),
});
export type AdminInsightsOutput = z.infer<typeof AdminInsightsOutputSchema>;

export async function generateAdminInsights(input: AdminInsightsInput): Promise<AdminInsightsOutput> {
  return adminInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminInsightsPrompt',
  input: {
    schema: z.object({
      totalUsers: z.number(),
      totalVideos: z.number(),
      totalOrders: z.number(),
      totalTips: z.number(),
      latestUsers: z.string(),
      topVideos: z.string(),
    })
  },
  output: {schema: AdminInsightsOutputSchema},
  prompt: `You are an AI assistant for the TalentVerse platform's admin. Your task is to provide a high-level summary and actionable insights based on the latest platform data.

  **Platform Snapshot:**
  - Total Users: {{{totalUsers}}}
  - Total Videos: {{{totalVideos}}}
  - Total Marketplace Orders: {{{totalOrders}}}
  - Total Tips Given: {{{totalTips}}}

  **Recent Activity:**
  - Latest Users (JSON): {{{latestUsers}}}
  - Top Performing Videos (JSON): {{{topVideos}}}

  **Instructions:**
  1.  **Summarize Key Metrics:** Briefly state the most important numbers (e.g., "The platform now has X users and Y videos.").
  2.  **Identify Growth & Trends:** Point out any notable trends. Is user growth accelerating? Are videos in a particular category performing well?
  3.  **Highlight Potential Issues:** Are there any red flags? For example, a high number of new users but low video uploads could indicate an engagement problem.
  4.  **Suggest Admin Actions:** Recommend 1-2 specific, actionable steps for the admin. Examples: "Feature the top-performing videos on the homepage to boost engagement," or "Reach out to new artists who haven't uploaded a video yet."
  5.  **Keep it Concise:** The entire output should be a short, easy-to-read summary. Use bullet points.
  `,
});

const adminInsightsFlow = ai.defineFlow(
  {
    name: 'adminInsightsFlow',
    inputSchema: AdminInsightsInputSchema,
    outputSchema: AdminInsightsOutputSchema,
  },
  async () => {
    // This flow runs on the server and can securely access Firestore.
    const { firestore } = getSdks();

    // Aggregate data
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const videosSnapshot = await getDocs(collection(firestore, 'videos'));
    const ordersSnapshot = await getDocs(collection(firestore, 'marketplace_orders'));
    const tipsSnapshot = await getDocs(collection(firestore, 'tips'));

    // Fetch latest 5 users
    const latestUsersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5));
    const latestUsersSnapshot = await getDocs(latestUsersQuery);
    const latestUsers = latestUsersSnapshot.docs.map(doc => ({
        username: doc.data().username,
        role: doc.data().role,
        createdAt: doc.data().createdAt?.toDate().toLocaleDateString(),
    }));

    // Fetch top 5 videos by rankingScore
    const topVideosQuery = query(collection(firestore, 'videos'), orderBy('rankingScore', 'desc'), limit(5));
    const topVideosSnapshot = await getDocs(topVideosQuery);
    const topVideos = topVideosSnapshot.docs.map(doc => ({
        description: doc.data().description,
        category: doc.data().videoCategory,
        topCount: doc.data().topCount,
        flopCount: doc.data().flopCount,
    }));

    // Generate insights
    const {output} = await prompt({
      totalUsers: usersSnapshot.size,
      totalVideos: videosSnapshot.size,
      totalOrders: ordersSnapshot.size,
      totalTips: tipsSnapshot.size,
      latestUsers: JSON.stringify(latestUsers, null, 2),
      topVideos: JSON.stringify(topVideos, null, 2),
    });

    return output!;
  }
);
