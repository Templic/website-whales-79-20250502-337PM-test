/**
 * NewsletterSignup.tsx
 * 
 * A component for users to sign up for the newsletter with name, email, and additional information
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Define schema for form validation
const newsletterSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  additionalInfo: z.string().optional(),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export default function NewsletterSignup() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      name: "",
      email: "",
      additionalInfo: "",
    },
  });

  const onSubmit = async (data: NewsletterForm) => {
    setIsSubmitting(true);

    try {
      await axios.post("/api/subscribe", data);
      
      toast({
        title: "Success!",
        description: "You've been successfully subscribed to our newsletter.",
        variant: "default",
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      
      toast({
        title: "Subscription failed",
        description: error.response?.data?.message || "There was an error subscribing to the newsletter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[rgba(10,50,92,0.3)] backdrop-blur-sm p-6 md:p-8 rounded-xl relative overflow-hidden border border-[#00ebd6]/30">
      <div className="absolute -right-20 -bottom-20 w-[200px] h-[200px] opacity-10 bg-gradient-to-tr from-[#00ebd6]/10 to-transparent rounded-full blur-xl"></div>
      
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#00ebd6] to-[#00ebd6]/50"></div>
        <h2 className="text-2xl font-bold text-[#00ebd6]">Join Our Cosmic Journey</h2>
        <p className="mt-2">Subscribe to receive the latest news, music releases, and cosmic adventures</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 gap-6">
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

            <div>
              <label className="block text-sm font-medium mb-2">Additional Information (Optional)</label>
              <Textarea
                {...form.register("additionalInfo")}
                className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                placeholder="Tell us about your interests or how you found us"
                rows={4}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white px-8 py-2 rounded-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                <span>Subscribing...</span>
              </>
            ) : (
              <span>Subscribe to Cosmic Updates</span>
            )}
          </Button>
        </form>
      </Form>
    </section>
  );
}