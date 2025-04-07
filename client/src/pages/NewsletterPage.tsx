/**
 * NewsletterPage.tsx
 * 
 * The main newsletter page that combines the signup form and recent newsletter display
 */
import NewsletterSignup from "@/components/features/newsletter/NewsletterSignup";
import RecentNewsletter from "@/components/features/newsletter/RecentNewsletter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function NewsletterPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-3">Cosmic Newsletter</h1>
        <p className="text-xl opacity-80">Subscribe for cosmic updates and read our latest newsletter</p>
      </div>

      <div className="relative min-h-[400px] mb-16">
        <div className="max-w-md mx-auto mb-10">
          <Tabs defaultValue="subscribe" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="subscribe" className="data-[state=active]:text-[#00ebd6]">Subscribe</TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:text-[#00ebd6]">Recent Newsletter</TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscribe" className="mt-2">
              <NewsletterSignup />
            </TabsContent>
            
            <TabsContent value="recent" className="mt-2">
              <RecentNewsletter />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Separator className="my-12 opacity-30" />

      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Why Subscribe?</h2>
        
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-lg bg-[rgba(10,50,92,0.2)] backdrop-blur-sm">
            <h3 className="text-lg font-medium text-[#00ebd6] mb-3">Exclusive Content</h3>
            <p className="text-sm">Be the first to hear unreleased tracks, demos, and behind-the-scenes content from my creative process.</p>
          </div>
          
          <div className="p-6 rounded-lg bg-[rgba(10,50,92,0.2)] backdrop-blur-sm">
            <h3 className="text-lg font-medium text-[#00ebd6] mb-3">Event Invitations</h3>
            <p className="text-sm">Get priority access to virtual and in-person concerts, meditation sessions, and cosmic gatherings.</p>
          </div>
          
          <div className="p-6 rounded-lg bg-[rgba(10,50,92,0.2)] backdrop-blur-sm">
            <h3 className="text-lg font-medium text-[#00ebd6] mb-3">Community Insights</h3>
            <p className="text-sm">Join a vibrant community of cosmic explorers and receive specialized content tailored to your interests.</p>
          </div>
        </div>
      </section>
    </div>
  );
}