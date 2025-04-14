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
import SacredGeometry from "@/components/ui/sacred-geometry";

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

  useEffect(() => {
    document.title = "Newsletter - Dale Loves Whales";
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 345);

    return () => clearInterval(interval);
  }, []);

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Newsletter</h1>
        <div className="space-y-8">
          {/* Hero Section with Sacred Geometry */}
          <div className="relative h-[500px] w-full overflow-hidden rounded-lg">
            <img
              src={images[currentImageIndex]}
              alt="Newsletter"
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
            />
            {/* Sacred geometry overlay */}
            <div className="absolute top-10 right-10 opacity-30 animate-spin-very-slow" style={{ animationDuration: '30s' }}>
              <SacredGeometry variant="merkaba" size={120} animated={false} intensity="medium" />
            </div>
            <div className="absolute bottom-10 left-10 opacity-30 animate-spin-very-slow" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              <SacredGeometry variant="octagon" size={100} animated={false} intensity="medium" />
            </div>
          </div>
          
          {/* Newsletter Content Section */}
          <div className="relative cosmic-glow-box p-8 md:p-12 lg:p-16 rounded-xl cosmic-slide-up">
            {/* Octagon shape container with clip-path - adjusted padding for better text fit */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                 clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                 
            <div className="relative z-10 px-4 py-6 md:px-8 lg:px-12 mx-auto max-w-4xl">
              {/* Sacred geometry hidden on mobile for performance */}
              <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                <SacredGeometry variant="octagon" size={80} animated={false} />
              </div>
              <div className="absolute -top-6 -left-6 opacity-10 hidden md:block">
                <SacredGeometry variant="merkaba" size={70} animated={false} />
              </div>
              
              {/* Reduced font size for better containment */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00ebd6] mb-6 text-center">Cosmic Update: A Journey of Creation</h2>
              
              <div className="text-center my-6">
                <img src="https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg" 
                  alt="Dale The Whale" 
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '250px', objectFit: 'contain' }} />
              </div>
              
              <div className="space-y-4 text-white">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#00ebd6] mb-2">The Birth of the Cosmic Site</h3>
                  <p className="text-base md:text-lg">We are thrilled to announce the launch of our new website, a hub where cosmic vibes meet music! The site reflects Dale's artistic journey and commitment to spreading cosmic consciousness.</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#00ebd6] mb-2">New Release: "Feels So Good"</h3>
                  <p className="text-base md:text-lg">We're excited to introduce Dale's latest single, "Feels So Good." This track captures the essence of joy and connecting with the universe. Available now on all streaming platforms!</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#00ebd6] mb-2">Pioneering 'Cosmic Consciousness'</h3>
                  <p className="text-base md:text-lg">Dale is leading a movement toward 'Cosmic Consciousness' - exploring our interconnectedness with the universe through sound, art, and community. Join this transformative journey!</p>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={() => window.open("https://www.youtube.com/watch?v=jzpvkq3Krjg", "_blank")}
                    className="bg-[#00ebd6] text-[#303436] px-5 py-2 rounded-full hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] cosmic-hover-glow"
                  >
                    Listen to "Feels So Good"
                  </Button>
                </div>
                
                <div className="text-center mt-6 italic text-gray-300">
                  <p className="text-lg">"Let the cosmic waves carry your spirit through the universe"</p>
                  <p className="mt-3 text-base">- Dale 🐋</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscribe Form Section */}
          <div className="relative">
            {/* Octagon shape container with clip-path */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                 clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                 
            <div className="relative z-10 p-8">
              {/* Sacred geometry hidden on mobile for performance */}
              <div className="absolute -top-6 -left-6 opacity-10 hidden md:block">
                <SacredGeometry variant="octagon" size={80} animated={false} />
              </div>
              
              <h2 className="text-2xl font-bold text-[#00ebd6] mb-6 text-center">Subscribe to Our Cosmic Newsletter</h2>
              <p className="text-xl mb-8 text-center">Stay updated with the latest news, releases, and cosmic adventures!</p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
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

                  <Button
                    type="submit"
                    className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] cosmic-hover-glow"
                  >
                    Subscribe
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="relative">
            {/* Octagon shape container with clip-path */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                 clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                 
            <div className="relative z-10 p-8">
              {/* Sacred geometry in the corner */}
              <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                <SacredGeometry variant="octagon" size={80} animated={false} />
              </div>
              
              <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">What You'll Get</h2>
              <ul className="space-y-4 list-none">
                <li className="flex items-center gap-3">
                  <span className="text-[#fe0064] flex-shrink-0">★</span>
                  <span>Exclusive behind-the-scenes content</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#fe0064] flex-shrink-0">★</span>
                  <span>Early access to new releases</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#fe0064] flex-shrink-0">★</span>
                  <span>Special subscriber-only offers</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#fe0064] flex-shrink-0">★</span>
                  <span>Updates on upcoming tours and events</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}