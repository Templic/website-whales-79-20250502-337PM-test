import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please enter a subject"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  
  useEffect(() => {
    document.title = "Contact - Dale Loves Whales";
  }, []);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactForm) => {
    toast({
      title: "Message Sent!",
      description: "Thank you for your message. We'll get back to you soon!",
    });
    form.reset();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Get in Touch</h1>
        <p className="text-xl mb-8">Have a question or want to connect? Drop us a message!</p>
      </section>

      <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
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

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                {...form.register("subject")}
                className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                placeholder="Enter subject"
              />
              {form.formState.errors.subject && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                {...form.register("message")}
                className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6] min-h-[150px]"
                placeholder="Type your message here..."
              />
              {form.formState.errors.message && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.message.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
            >
              Send Message
            </Button>
          </form>
        </Form>
      </section>

      <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Other Ways to Connect</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Social Media</h3>
            <ul className="space-y-2">
              <li>Facebook: @DaleLovesWhales</li>
              <li>Twitter: @DaleWhales</li>
              <li>Instagram: @DaleLovesWhales</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Business Inquiries</h3>
            <p>For business and booking inquiries, please email:</p>
            <p className="text-[#00ebd6]">booking@daleloveswhales.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
