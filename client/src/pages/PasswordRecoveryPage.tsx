/**
 * PasswordRecoveryPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const recoverySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RecoveryFormData = z.infer<typeof recoverySchema>;

export default function PasswordRecoveryPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RecoveryFormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/recover-password", data);
      toast({
        title: "Recovery email sent",
        description: "Please check your email for further instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send recovery email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8">
      <div className="p-8 rounded-lg bg-card">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Password Recovery</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Recovery Email"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
