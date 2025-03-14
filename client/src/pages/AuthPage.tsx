import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Login form
  const loginForm = useForm<Pick<InsertUser, "username" | "password">>({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Registration form
  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Forms Column */}
      <div className="p-8 flex flex-col justify-center space-y-8">
        {/* Login Form */}
        <div>
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Login</h2>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(data => loginMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  {...loginForm.register("username")}
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  {...loginForm.register("password")}
                  type="password"
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Registration Form */}
        <div>
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Register</h2>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(data => registerMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  {...registerForm.register("username")}
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Choose a username"
                />
                {registerForm.formState.errors.username && (
                  <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  {...registerForm.register("email")}
                  type="email"
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Enter your email"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  {...registerForm.register("password")}
                  type="password"
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Choose a password"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input
                  {...registerForm.register("confirmPassword")}
                  type="password"
                  className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                  placeholder="Confirm your password"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button 
                type="submit"
                className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Register"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Hero Column */}
      <div 
        className="hidden md:flex flex-col justify-center p-16 text-center bg-cover bg-center"
        style={{
          background: `linear-gradient(rgba(48, 52, 54, 0.8), rgba(10, 50, 92, 0.9)),
            url(https://onlyinhawaii.org/wp-content/uploads/2011/03/Rainbow-Falls.jpg)
            no-repeat center center / cover`
        }}
      >
        <h1 className="text-4xl font-bold mb-6 text-[#00ebd6]">Welcome to Dale Loves Whales</h1>
        <p className="text-xl mb-8">
          Join our community to explore the depths of cosmic music and oceanic vibes.
        </p>
        <div className="text-lg opacity-80">
          <p>✓ Access exclusive content</p>
          <p>✓ Join the conversation</p>
          <p>✓ Stay updated with latest releases</p>
        </div>
      </div>
    </div>
  );
}
