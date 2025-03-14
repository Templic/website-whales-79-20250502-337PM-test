import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Calendar, ArrowRight, Tag, Heart } from "lucide-react";

export default function BlogPage() {
  const { toast } = useToast();

  const { data: posts, isLoading, error } = useQuery<Post[]>({ 
    queryKey: ['/api/posts'],
    retry: 1
  });

  const handleShare = async (post: Post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.content.substring(0, 150),
          url: window.location.origin + `/blog/${post.id}`
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + `/blog/${post.id}`);
        toast({
          title: "Link Copied!",
          description: "Post link copied to clipboard"
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load blog posts",
      variant: "destructive"
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" role="main">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Cosmic Chronicles</h1>
        <p className="text-xl">Dive into Dale's thoughts, stories, and musical journey</p>
      </header>

      <section 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        aria-label="Blog posts"
      >
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
          <article 
            key={post.id} 
            className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg backdrop-blur-sm hover:transform hover:scale-[1.02] transition-transform"
            itemScope 
            itemType="http://schema.org/BlogPosting"
          >
            {(post.thumbnailImage || post.featuredImage) && (
              <figure className="mb-4 relative group">
                <img 
                  src={post.thumbnailImage || post.featuredImage}
                  alt={post.imageMetadata?.altText || `Featured image for ${post.title}`}
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                  itemProp="image"
                  width={post.imageMetadata?.width}
                  height={post.imageMetadata?.height}
                />
                {post.imageMetadata?.caption && (
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {post.imageMetadata.caption}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="space-y-4">
              <header>
                <h2 
                  className="text-2xl font-bold text-[#00ebd6] hover:text-[#fe0064] transition-colors"
                  itemProp="headline"
                >
                  <Link href={`/blog/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.createdAt} itemProp="datePublished">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </header>

              <div itemProp="description" className="line-clamp-3 text-gray-300">
                {post.excerpt || post.content.substring(0, 150) + "..."}
              </div>

              <footer className="pt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {post.categories?.map(category => (
                    <Badge 
                      key={category} 
                      variant="secondary"
                      className="bg-[rgba(0,235,214,0.1)] text-[#00ebd6] hover:bg-[rgba(0,235,214,0.2)]"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Link href={`/blog/${post.id}`}>
                    <Button 
                      className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white inline-flex items-center gap-2"
                      aria-label={`Read more about ${post.title}`}
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-[#fe0064]"
                      onClick={() => handleShare(post)}
                      aria-label="Share post"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </footer>
            </div>
          </article>
        ))}
      </section>

      {posts && posts.length > 0 && (
        <footer className="flex justify-center mt-12">
          <Button 
            className="bg-[#00ebd6] text-[#303436] px-8 py-6 rounded-full hover:bg-[#fe0064] hover:text-white"
            onClick={() => toast({
              title: "Coming Soon",
              description: "More posts will be available soon!"
            })}
          >
            Load More Posts
          </Button>
        </footer>
      )}
    </main>
  );
}