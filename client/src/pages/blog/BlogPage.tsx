/**
 * BlogPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */

import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/lib/date-utils";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SacredGeometry from "@/components/ui/sacred-geometry";

export default function BlogPage() {
  const { toast } = useToast();
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      return res.json();
    },
    retry: 1,
  });

  const handleLoadMore = () => {
    toast({
      title: "Coming Soon",
      description: "More posts will be available soon!",
    });
  };

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        {/* Header with sacred geometry */}
        <div className="relative mb-10">
          <h1 className="text-4xl font-bold text-[#00ebd6] mb-2 text-center">Cosmic Blog</h1>
          <p className="text-center text-gray-300 max-w-2xl mx-auto mb-6">
            Explore the journey of cosmic consciousness through Dale's experiences, insights, and adventures
          </p>
          
          {/* Sacred geometry elements */}
          <div className="absolute -top-14 -right-4 opacity-20 hidden md:block">
            <div className="animate-spin-very-slow" style={{ animationDuration: '30s' }}>
              <SacredGeometry variant="octagon" size={100} animated={false} intensity="medium" />
            </div>
          </div>
          <div className="absolute -bottom-10 -left-4 opacity-20 hidden md:block">
            <div className="animate-spin-very-slow" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              <SacredGeometry variant="merkaba" size={80} animated={false} intensity="medium" />
            </div>
          </div>
        </div>
        
        {/* Blog posts */}
        {isLoading ? (
          <div className="relative">
            {/* Octagon shape container with clip-path */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                
            <div className="relative z-10 p-8">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm transform transition-all 
                clip-path-octagon border-2 border-red-500/30 z-0"></div>
                
            <div className="relative z-10 p-8 text-center">
              <p className="text-red-400">Error loading posts. Please try again later.</p>
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="relative group">
                {/* Octagon shape container with clip-path */}
                <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                    clip-path-octagon border-2 border-[#00ebd6]/30 z-0 group-hover:border-[#00ebd6]/60"></div>
                
                {/* Sacred geometry in bottom corner - only visible on hover */}
                <div className="absolute -bottom-6 -right-6 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                  <SacredGeometry variant="octagon" size={80} animated={false} />
                </div>
                
                <div className="relative z-10 p-8">
                  {post.featuredImage && (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-[#00ebd6] mb-2">{post.title}</h2>
                  
                  <div className="text-gray-300 mb-4">
                    {post.content}
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-[#fe0064]">
                      Published: {formatDisplayDate(post.createdAt)}
                    </p>
                    <Button 
                      className="text-sm bg-transparent border border-[#00ebd6] text-[#00ebd6] hover:bg-[#00ebd6]/10 hover:shadow-[0_0_10px_rgba(0,235,214,0.4)]"
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                
            <div className="relative z-10 p-16 text-center">
              <SacredGeometry variant="octagon" size={100} animated={false} className="mx-auto opacity-30 mb-6" />
              <p className="text-xl text-gray-300">No posts found. Check back soon for cosmic insights!</p>
            </div>
          </div>
        )}

        {posts && posts.length > 0 && (
          <footer className="flex justify-center mt-12">
            <Button
              className="bg-[#00ebd6] text-black px-8 py-3 rounded-full transition-all duration-300 hover:bg-[#fe0064] hover:text-white hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(254,0,100,0.7)]"
              onClick={handleLoadMore}
            >
              Load More Posts
            </Button>
          </footer>
        )}
      </div>
    </>
  );
}
