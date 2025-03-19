import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Redirect, Link } from "wouter";
import { Loader2, Eye, EyeOff, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import * as z from 'zod';

const passwordStrengthText = {
  0: "Very Weak",
  1: "Weak",
  2: "Medium",
  3: "Strong",
  4: "Very Strong"
};

const passwordStrengthColor = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-yellow-500",
  3: "bg-green-500",
  4: "bg-emerald-500"
};

// Password validation rules
const passwordRules = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[A-Z]/, text: "At least one uppercase letter" },
  { regex: /[a-z]/, text: "At least one lowercase letter" },
  { regex: /[0-9]/, text: "At least one number" },
  { regex: /[^A-Za-z0-9]/, text: "At least one special character" }
];

function calculatePasswordStrength(password: string): number {
  return passwordRules.reduce((score, rule) => 
    score + (rule.regex.test(password) ? 1 : 0), 0);
}

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  // Extended registration schema with password confirmation
  const extendedRegisterSchema = insertUserSchema.extend({
    confirmPassword: z.string()
      .min(1, "Please confirm your password")
      .refine((data) => data === registerForm.getValues().password, {
        message: "Passwords do not match"
      })
  });

  // Registration form
  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Handle password strength calculation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

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
                <div className="relative">
                  <Input
                    {...loginForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Link href="/recover-password" className="text-sm text-[#00ebd6] hover:text-[#fe0064]">
                  Forgot Password?
                </Link>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Password</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 p-4">
                        <p className="font-semibold mb-2">Password Requirements:</p>
                        <ul className="space-y-1">
                          {passwordRules.map((rule, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <span className={rule.regex.test(registerForm.watch("password")) ? "text-green-500" : "text-gray-400"}>
                                • {rule.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    {...registerForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                    placeholder="Choose a password"
                    onChange={handlePasswordChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                )}
                <div className="mt-2">
                  <Progress value={passwordStrength * 25} className={`h-2 ${passwordStrengthColor[passwordStrength]}`} />
                  <p className="text-sm mt-1 text-gray-400">
                    Password Strength: {passwordStrengthText[passwordStrength]}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Input
                    {...registerForm.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                    placeholder="Confirm your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
        <h1 className="text-4xl font-bold text-[#00ebd6]">Welcome to Dale Loves Whales</h1>
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