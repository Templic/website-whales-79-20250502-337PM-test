import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Contact - Dale Loves Whales";
  }, []);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      const response = await fetch("/api/contact", {
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Get in Touch</h1>
      <p className="mb-8">Have a question or want to connect? Drop us a message!</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input {...form.register("name")} className="w-full" />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input {...form.register("email")} type="email" className="w-full" />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea {...form.register("message")} className="w-full min-h-[150px]" />
            {form.formState.errors.message && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.message.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      </Form>
    </div>
  );
}