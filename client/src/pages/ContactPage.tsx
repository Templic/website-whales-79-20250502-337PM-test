/**
 * ContactPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Enhanced with cosmic sacred geometry theme.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const pageTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Contact - Dale Loves Whales";
    // Scroll to top of page when component mounts
    pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050f28] text-[#e8e6e3] relative" ref={pageTopRef}>
      {/* Cosmic Background */}
      <CosmicBackground opacity={0.5} color="teal" nebulaEffect={true} />
      
      {/* Sacred geometry elements in page margins */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="torus" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="merkaba" size={120} animate={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="golden-ratio" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="flower-of-life" size={120} animate={true} />
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
        {/* Header with cosmic styling */}
        <div className="relative mb-16">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-14 -right-14 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center cosmic-slide-up">
            <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-teal-900/40 to-cyan-900/40 border border-teal-500/20">
              <Mail className="h-10 w-10 text-teal-400" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
              Contact Us
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-teal-100/90 max-w-2xl mx-auto">
              Have questions or want to connect with us? Send us a message and we'll get back to you soon.
            </p>
          </div>
        </div>
        
        <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg mb-6 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-teal-200">Name</label>
                  <Input 
                    {...form.register("name")} 
                    className="w-full bg-teal-900/40 border-teal-500/30 focus:border-teal-400 text-white" 
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-teal-200">Email</label>
                  <Input 
                    {...form.register("email")} 
                    type="email" 
                    className="w-full bg-teal-900/40 border-teal-500/30 focus:border-teal-400 text-white" 
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-teal-200">Message</label>
                  <Textarea 
                    {...form.register("message")} 
                    className="w-full min-h-[150px] bg-teal-900/40 border-teal-500/30 focus:border-teal-400 text-white" 
                  />
                  {form.formState.errors.message && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.message.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center p-6 bg-gradient-to-br from-teal-900/20 to-cyan-900/20 rounded-xl border border-teal-500/20 backdrop-blur-sm mb-10 relative cosmic-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
          
          <p className="text-md max-w-2xl mx-auto relative z-10">
            You can also reach us on our social media channels. We're always excited to connect with our community and 
            hear your thoughts about cosmic consciousness and sacred sound.
          </p>
        </div>
      </div>
    </div>
  );
}