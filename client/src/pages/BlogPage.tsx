import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPage() {
  const { toast } = useToast();

  const { data: posts, isLoading, error } = useQuery<Post[]>({ 
    queryKey: ['/api/posts'],
    retry: 1
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load blog posts",
      variant: "destructive"
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Cosmic Chronicles</h1>
        <p className="text-xl">Dive into Dale's thoughts, stories, and musical journey</p>
      </section>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg backdrop-blur-sm">
              <Skeleton className="w-full h-48 rounded-lg mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>
          ))
        ) : posts?.map((post) => (
          <article key={post.id} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg backdrop-blur-sm hover:transform hover:scale-[1.02] transition-transform">
            {post.featuredImage && (
              <img 
                src={post.featuredImage} 
                alt={post.title} 
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#00ebd6] hover:text-[#fe0064] transition-colors">
                {post.title}
              </h2>
              <div className="flex items-center text-sm text-gray-400">
                <time>{new Date(post.createdAt).toLocaleDateString()}</time>
              </div>
              <p className="line-clamp-3 text-gray-300">
                {post.excerpt || post.content.substring(0, 150) + "..."}
              </p>
              <div className="pt-4">
                <Link href={`/blog/${post.id}`}>
                  <Button className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white">
                    Read More
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {posts && posts.length > 0 && (
        <div className="flex justify-center mt-12">
          <Button 
            className="bg-[#00ebd6] text-[#303436] px-8 py-6 rounded-full hover:bg-[#fe0064] hover:text-white"
            onClick={() => toast({
              title: "Coming Soon",
              description: "More posts will be available soon!"
            })}
          >
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
}