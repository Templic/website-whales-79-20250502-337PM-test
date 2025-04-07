/**
 * RecentNewsletter.tsx
 * 
 * A component to display the most recent newsletter
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

interface Newsletter {
  id: number;
  title: string;
  content: string;
  status: string;
  sentAt: string;
  createdAt: string;
}

export default function RecentNewsletter() {
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/latest-newsletter");
        setNewsletter(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching newsletter:", err);
        setError(err.response?.data?.message || "Failed to load the latest newsletter");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletter();
  }, []);

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-[rgba(10,50,92,0.6)] border-[#00ebd6]/50 overflow-hidden">
        <CardHeader className="pb-4 relative">
          <Skeleton className="h-7 w-3/4 bg-[#00ebd6]/20" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-[#00ebd6]/30"></div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-full bg-[#00ebd6]/20 mb-3" />
          <Skeleton className="h-5 w-full bg-[#00ebd6]/20 mb-3" />
          <Skeleton className="h-5 w-3/4 bg-[#00ebd6]/20 mb-5" />
          <Skeleton className="h-24 w-full bg-[#00ebd6]/20 mb-3" />
          <Skeleton className="h-5 w-2/4 bg-[#00ebd6]/20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-sm bg-[rgba(10,50,92,0.6)] border-[#fe0064]/50 text-center p-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#fe0064]/70 to-[#fe0064]/30"></div>
        <CardTitle className="text-[#fe0064] mb-2">Newsletter Unavailable</CardTitle>
        <p className="text-sm opacity-80">We're preparing something special. Check back soon for our latest cosmic updates!</p>
      </Card>
    );
  }

  if (!newsletter) {
    return (
      <Card className="backdrop-blur-sm bg-[rgba(10,50,92,0.6)] border-[#00ebd6]/50 text-center p-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#00ebd6]/70 to-[#00ebd6]/30"></div>
        <CardTitle className="text-[#00ebd6] mb-2">Coming Soon</CardTitle>
        <p className="text-sm opacity-80">Our first newsletter is on its way! Subscribe now to make sure you don't miss it.</p>
      </Card>
    );
  }

  // Format the date nicely
  const sentDate = new Date(newsletter.sentAt);
  const formattedDate = sentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="backdrop-blur-sm bg-[rgba(10,50,92,0.6)] border-[#00ebd6]/50 overflow-hidden">
      <CardHeader className="pb-4 border-b border-[#00ebd6]/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-[#00ebd6]">{newsletter.title}</CardTitle>
          <p className="text-sm mt-1 opacity-80">Sent on {formattedDate}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00ebd6] to-[#00ebd6]/50"></div>
      </CardHeader>
      <CardContent className="pt-5">
        <div 
          className="prose prose-invert max-w-none prose-headings:text-[#00ebd6] prose-a:text-[#fe0064]"
          dangerouslySetInnerHTML={{ __html: newsletter.content }}
        />
      </CardContent>
    </Card>
  );
}