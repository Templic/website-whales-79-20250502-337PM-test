import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Redirect, Link } from "wouter";
import { Loader2, Eye, EyeOff, Info, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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

const registrationSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ContactForm = z.infer<typeof registrationSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPasswordReqOpen, setIsPasswordReqOpen] = useState(false);

  if (user) {
    return <Redirect to="/" />;
  }

  const loginForm = useForm<Pick<typeof registrationSchema["_type"], "username" | "password">>({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<ContactForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

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
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8">
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
            <form onSubmit={registerForm.handleSubmit(data => {
              const { confirmPassword, ...registerData } = data;
              registerMutation.mutate(registerData);
            })} className="space-y-4">
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
                  <Dialog open={isPasswordReqOpen} onOpenChange={setIsPasswordReqOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-transparent focus:bg-transparent relative z-50"
                        onClick={() => setIsPasswordReqOpen(true)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-[#00ebd6]">Password Requirements</DialogTitle>
                        <DialogDescription>
                          Your password must meet the following criteria:
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-[rgba(48,52,54,0.95)] p-4 rounded-lg">
                        <ul className="space-y-2">
                          {passwordRules.map((rule, index) => (
                            <li key={index} className="flex items-center text-sm">
                              {rule.regex.test(registerForm.watch("password")) ? (
                                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              ) : (
                                <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                              )}
                              <span
                                className={`${
                                  rule.regex.test(registerForm.watch("password"))
                                    ? "text-green-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {rule.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsPasswordReqOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Input
                    {...registerForm.register("password", {
                      onChange: handlePasswordChange
                    })}
                    type={showPassword ? "text" : "password"}
                    className="w-full p-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                    placeholder="Choose a password"
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
                  <Progress value={passwordStrength * 25} className={`h-2 ${passwordStrengthColor[passwordStrength as keyof typeof passwordStrengthColor]}`} />
                  <p className="text-sm mt-1 text-gray-400">
                    Password Strength: {passwordStrengthText[passwordStrength as keyof typeof passwordStrengthText]}
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
    </div>
  );
}