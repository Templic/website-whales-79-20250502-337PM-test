
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/lib/date-utils";
import { SpotlightEffect } from "@/components/SpotlightEffect";

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
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Blog</h1>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p>Error loading posts.</p>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="relative">
                <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] backdrop-blur-sm transform transition-all clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                <div className="relative z-10 p-8">
                {post.featuredImage && (
                  <img 
                    src={post.featuredImage} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h2 className="text-2xl font-bold text-[#00ebd6] mb-2">{post.title.replace(/<[^>]*>/g, '')}</h2>
                <p className="text-gray-300 mb-4">{post.content.replace(/<[^>]*>/g, '')}</p>
                <p className="text-sm text-[#fe0064]">
                  Published: {formatDisplayDate(post.createdAt)}
                </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No posts found.</p>
        )}

        {posts && posts.length > 0 && (
          <footer className="flex justify-center mt-12">
            <Button
              className="bg-[#00ebd6] text-black px-8 py-6 rounded-full transition-all duration-300 hover:bg-[#fe0064] hover:text-white hover:translate-y-[-2px] hover:shadow-lg cosmic-hover-glow"
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
