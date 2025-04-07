/**
 * NewsletterPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Please enter your name"),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

const images = [
  "uploads/dale in chair (1).jpg",
  "uploads/dale in chair (2).jpg",
  "uploads/dale in chair (3).jpg"
];

export default function NewsletterPage() {
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { reducedMotion } = useAccessibility();

  useEffect(() => {
    document.title = "Newsletter - Dale Loves Whales";
    
    // Only run the image rotation animation if reduced motion is not enabled
    let interval: NodeJS.Timeout | undefined;
    
    if (!reducedMotion) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3450);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reducedMotion]);

  const form = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const onSubmit = (data: NewsletterForm) => {
    toast({
      title: "Success!",
      description: "You've been successfully subscribed to our newsletter.",
    });
    form.reset();
  };

  return (
    <>
      <SpotlightEffect />
      {/* Sacred Geometry Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SacredGeometry type="flower-of-life" className="absolute top-20 left-10 opacity-20 w-[300px] h-[300px] text-[#00ebd6]" />
        <SacredGeometry type="metatron-cube" className="absolute bottom-40 right-10 opacity-15 w-[400px] h-[400px] text-[#fe0064]" />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#00ebd6] text-center md:text-left">
            Cosmic Newsletter
          </h1>
          <div className="ml-0 md:ml-4 mt-2 md:mt-0">
            <SacredGeometry type="metatron-cube" className="w-8 h-8 inline-block text-[#fe0064]" />
          </div>
        </div>
        
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Image section with sacred geometry overlay */}
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full overflow-hidden rounded-lg">
            <img
              src={images[currentImageIndex]}
              alt="Newsletter"
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050f28]/70 to-transparent pointer-events-none"></div>
            <SacredGeometry type="sri-yantra" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] text-white opacity-30" />
          </div>
          
          <section className="text-center backdrop-blur-sm bg-[#050f28]/30 p-6 rounded-lg">
            <SacredGeometry type="pentagon-star" className="w-12 h-12 mx-auto mb-4 text-[#00ebd6]" />
            <p className="text-lg md:text-xl mb-4">Stay connected to the cosmic rhythms!</p>
            <p className="text-base md:text-lg">Subscribe to receive the latest news, music releases, and cosmic adventures.</p>
          </section>

          {/* Subscription form with sacred geometry accents */}
          <section className="cosmic-glow-box p-6 md:p-8 rounded-xl cosmic-slide-up relative overflow-hidden">
            <SacredGeometry type="flower-of-life" className="absolute -right-20 -bottom-20 w-[200px] h-[200px] text-[#00ebd6] opacity-10" />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      {...form.register("name")}
                      className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                      placeholder="Enter your name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      {...form.register("email")}
                      type="email"
                      className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                      placeholder="Enter your email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white px-8 py-2 rounded-full flex items-center justify-center gap-2"
                >
                  <span>Subscribe to Cosmic Updates</span>
                  <SacredGeometry type="pentagon-star" className="w-4 h-4 inline-block" />
                </Button>
              </form>
            </Form>
          </section>

          {/* Benefits section with sacred geometry icons */}
          <section className="bg-[rgba(10,50,92,0.6)] p-6 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#00ebd6]">Cosmic Benefits</h2>
              <SacredGeometry type="flower-of-life" className="w-6 h-6 ml-3 text-[#00ebd6]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <SacredGeometry type="pentagon-star" className="w-5 h-5 mt-1 text-[#fe0064] flex-shrink-0" />
                  <span>Exclusive behind-the-scenes cosmic content</span>
                </div>
                <div className="flex items-start space-x-3">
                  <SacredGeometry type="hexagon" className="w-5 h-5 mt-1 text-[#fe0064] flex-shrink-0" />
                  <span>Early access to new music releases</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <SacredGeometry type="vesica-piscis" className="w-5 h-5 mt-1 text-[#fe0064] flex-shrink-0" />
                  <span>Special subscriber-only cosmic offers</span>
                </div>
                <div className="flex items-start space-x-3">
                  <SacredGeometry type="golden-spiral" className="w-5 h-5 mt-1 text-[#fe0064] flex-shrink-0" />
                  <span>Updates on upcoming cosmic tours and events</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}