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
        <div className="space-y-6"> {/* This line has been changed */}
          <div className="relative h-[500px] w-full overflow-hidden rounded-lg">
            <img
              src={images[currentImageIndex]}
              alt="Newsletter"
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
            />
          </div>
          <section className="text-center">
            <p className="text-xl mb-8">Stay updated with the latest news, releases, and cosmic adventures!</p>
          </section>

          <section className="cosmic-glow-box p-8 rounded-xl cosmic-slide-up">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                >
                  Subscribe
                </Button>
              </form>
            </Form>
          </section>

          <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">What You'll Get</h2>
            <ul className="space-y-4 list-none">
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Exclusive behind-the-scenes content</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Early access to new releases</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Special subscriber-only offers</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Updates on upcoming tours and events</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}