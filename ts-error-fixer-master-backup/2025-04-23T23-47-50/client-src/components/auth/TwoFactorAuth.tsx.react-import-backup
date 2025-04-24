/**
 * TwoFactorAuth.tsx
 *
 * Component for handling two-factor authentication verification.
 * This is displayed when a user logs in and two-factor authentication is required.
 */import React from "react";


import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Smartphone, Key, ArrowLeft, Loader2 } from "lucide-react";

const twoFactorSchema = z.object({
  token: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

const backupCodeSchema = z.object({
  backupCode: z.string().min(1, "Backup code is required"),
});

type TwoFactorForm = z.infer<typeof twoFactorSchema>;
type BackupCodeForm = z.infer<typeof backupCodeSchema>;

interface TwoFactorAuthProps {
  onSuccess?: (userData) => void;
  onCancel?: () => void;
}

export function TwoFactorAuth({ onSuccess, onCancel }: TwoFactorAuthProps) {
  const { verify2FAMutation, verifyBackupCodeMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("token");

  const tokenForm = useForm<TwoFactorForm>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      token: "",
    },
  });

  const backupCodeForm = useForm<BackupCodeForm>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: {
      backupCode: "",
    },
  });

  const handleSubmitToken = async (data: TwoFactorForm) => {
    try {
      const userData = await verify2FAMutation.mutateAsync(data);
      if (onSuccess) onSuccess(userData);
    } catch (error: unknown) {
      // Error handling is done in the mutation
    }
  };

  const handleSubmitBackupCode = async (data: BackupCodeForm) => {
    try {
      const userData = await verifyBackupCodeMutation.mutateAsync(data);
      if (onSuccess) onSuccess(userData);
    } catch (error: unknown) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="-ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-[#00ebd6] text-center flex-1">Two-Factor Authentication</CardTitle>
          <div className="w-4"></div> {/* Spacer for alignment */}
        </div>
        <CardDescription className="text-center">
          Verify your identity to complete the login process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="token" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token" className="flex items-center justify-center">
              <Smartphone className="w-4 h-4 mr-2" />
              Authentication App
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center justify-center">
              <Key className="w-4 h-4 mr-2" />
              Backup Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="token">
            <Form {...tokenForm}>
              <form onSubmit={tokenForm.handleSubmit(handleSubmitToken)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Enter the 6-digit verification code</Label>
                  <Input
                    id="token"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="text-center tracking-widest text-lg"
                    inputMode="numeric"
                    {...tokenForm.register("token")}
                  />
                  {tokenForm.formState.errors.token && (
                    <p className="text-red-500 text-sm">
                      {tokenForm.formState.errors.token.message}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Open your authenticator app to view your verification code
                </p>

                <Button
                  type="submit"
                  className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                  disabled={verify2FAMutation.isPending}
                >
                  {verify2FAMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="backup">
            <Form {...backupCodeForm}>
              <form onSubmit={backupCodeForm.handleSubmit(handleSubmitBackupCode)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="backupCode">Enter a backup code</Label>
                  <Input
                    id="backupCode"
                    placeholder="XXXXX-XXXXX"
                    className="text-center tracking-wider"
                    {...backupCodeForm.register("backupCode")}
                  />
                  {backupCodeForm.formState.errors.backupCode && (
                    <p className="text-red-500 text-sm">
                      {backupCodeForm.formState.errors.backupCode.message}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Use one of your backup codes that you saved when setting up two-factor authentication.
                  Each code can only be used once.
                </p>

                <Button
                  type="submit"
                  className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                  disabled={verifyBackupCodeMutation.isPending}
                >
                  {verifyBackupCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="flex items-center text-sm text-gray-500">
          <ShieldCheck className="h-4 w-4 mr-2 text-[#00ebd6]" />
          <span>Two-factor authentication enhances your account security</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default TwoFactorAuth;