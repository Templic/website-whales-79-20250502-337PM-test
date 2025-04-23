/**
 * TwoFactorSetup.tsx
 *
 * Component for setting up two-factor authentication.
 * This guides users through the process of enabling 2FA for their account.
 */
import React from "react";


import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Steps, Step } from "@/components/ui/steps";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  CopyIcon,
  Smartphone,
  QrCode,
  ShieldAlert,
  Loader2,
  Download,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TokenFormValues = {
  token: string;
};

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const { setup2FAMutation, activate2FAMutation } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  // Form for token verification
  const tokenForm = useForm<TokenFormValues>({
    resolver: zodResolver(
      z.object({
        token: z
          .string()
          .min(6, "Verification code must be 6 digits")
          .max(6, "Verification code must be 6 digits")
          .regex(/^\d{6}$/, "Verification code must be 6 digits"),
      })
    ),
    defaultValues: {
      token: "",
    },
  });

  // Start the 2FA setup process
  const startSetup = async () => {
    try {
      const data = await setup2FAMutation.mutateAsync();
      setSetupData(data);
      setStep(1);
    } catch (error: unknown) {
      // Error handling is done in the mutation
    }
  };

  // Copy secret key to clipboard
  const copySecretToClipboard = () => {
    if (!setupData?.secret) return;
    
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    
    toast({
      title: "Secret Key Copied",
      description: "The secret key has been copied to your clipboard.",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };

  // Copy backup codes to clipboard
  const copyBackupCodesToClipboard = () => {
    if (!setupData?.backupCodes || setupData.backupCodes.length === 0) return;
    
    const codesText = setupData.backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setBackupCodesCopied(true);
    
    toast({
      title: "Backup Codes Copied",
      description: "Your backup codes have been copied to your clipboard.",
    });
    
    setTimeout(() => setBackupCodesCopied(false), 3000);
  };

  // Download backup codes as a text file
  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes || setupData.backupCodes.length === 0) return;
    
    const codesText = "BACKUP CODES - KEEP THESE SAFE\n\n" + 
      setupData.backupCodes.join("\n") + 
      "\n\nEach code can only be used once. Store these somewhere safe.";
    
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup Codes Downloaded",
      description: "Your backup codes have been downloaded as a text file.",
    });
  };

  // Verify token and activate 2FA
  const handleVerifyToken = async (data: TokenFormValues) => {
    if (!setupData) return;
    
    try {
      await activate2FAMutation.mutateAsync({
        token: data.token,
        secret: setupData.secret,
      });
      
      setStep(3); // Move to completion step
    } catch (error: unknown) {
      // Error handling is done in the mutation
    }
  };

  // Handle completion of the setup process
  const handleComplete = () => {
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  return (
    <div className="p-6">
      <DialogHeader className="pb-4">
        <DialogTitle className="text-[#00ebd6]">Set Up Two-Factor Authentication</DialogTitle>
        <DialogDescription>
          Adding two-factor authentication provides an extra layer of security for your account
        </DialogDescription>
      </DialogHeader>

      <div className="my-6">
        <Steps currentStep={step} className="pb-6">
          <Step title="Get Started" />
          <Step title="Setup App" />
          <Step title="Verify" />
          <Step title="Backup Codes" />
        </Steps>
      </div>

      <Separator className="my-4" />

      {/* Step 0: Introduction */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <ShieldAlert className="h-8 w-8 text-[#00ebd6] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Why use two-factor authentication?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Two-factor authentication adds an extra layer of security to your account.
                Even if your password is compromised, an attacker won't be able to access
                your account without the verification code from your authenticator app.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Smartphone className="h-8 w-8 text-[#00ebd6] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium">You'll need an authenticator app</h3>
              <p className="text-sm text-gray-500 mt-1">
                We recommend using Google Authenticator, Microsoft Authenticator, Authy, or
                1Password. These apps generate unique verification codes that change every 30 seconds.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={startSetup}
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
              disabled={setup2FAMutation.isPending}
            >
              {setup2FAMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting setup...
                </>
              ) : (
                <>
                  Begin Setup <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* Step 1: Set up authenticator app */}
      {step === 1 && setupData && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Set up your authenticator app</h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              1. Open your authenticator app on your mobile device
            </p>
            <p className="text-sm text-gray-500">
              2. Tap the + or Add button in your authenticator app
            </p>
            <p className="text-sm text-gray-500">
              3. Scan the QR code below or manually enter the secret key
            </p>
          </div>

          <div className="flex justify-center my-6">
            <div className="bg-white p-4 rounded-md">
              <img
                src={setupData.qrCode}
                alt="QR Code for authenticator app"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-400">Secret Key</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={copySecretToClipboard}
              >
                {copied ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <CopyIcon className="h-3 w-3 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="font-mono text-sm mt-1 tracking-wider text-white break-all">
              {setupData.secret}
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* Step 2: Verify token */}
      {step === 2 && setupData && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Verify setup</h3>
          
          <p className="text-sm text-gray-500">
            Enter the 6-digit verification code from your authenticator app to verify that
            everything is set up correctly.
          </p>

          <Form {...tokenForm}>
            <form onSubmit={tokenForm.handleSubmit(handleVerifyToken)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Verification Code</Label>
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

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                  disabled={activate2FAMutation.isPending}
                >
                  {activate2FAMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify & Activate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      )}

      {/* Step 3: Backup codes */}
      {step === 3 && setupData && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-green-500 flex items-center">
            <Check className="mr-2 h-5 w-5" />
            Two-factor authentication enabled!
          </h3>
          
          <p className="text-sm text-gray-500">
            Save these backup codes in a secure location. If you lose access to your
            authenticator app, you can use one of these backup codes to sign in.
            Each code can only be used once.
          </p>

          <div className="bg-gray-800 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm p-1 bg-gray-700 rounded text-center text-white"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={copyBackupCodesToClipboard}
            >
              {backupCodesCopied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <CopyIcon className="mr-2 h-4 w-4" />
              )}
              {backupCodesCopied ? "Copied!" : "Copy Codes"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={downloadBackupCodes}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Codes
            </Button>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 my-4">
            <p className="text-sm text-yellow-300">
              <strong>Important:</strong> Without these backup codes or your authenticator app,
              you will not be able to access your account if you lose your device.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleComplete}
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      )}
    </div>
  );
}

export default TwoFactorSetup;