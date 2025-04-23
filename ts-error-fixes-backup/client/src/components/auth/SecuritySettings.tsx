/**
 * SecuritySettings.tsx
 * 
 * Component for managing security settings, including two-factor authentication.
 */

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  Loader2 
} from "lucide-react";

// Schema for password confirmation when disabling 2FA
const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type PasswordForm = z.infer<typeof passwordSchema>;

export function SecuritySettings() {
  const { 
    user, 
    setup2FAMutation, 
    activate2FAMutation, 
    disable2FAMutation,
    regenerateBackupCodesMutation 
  } = useAuth();
  
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form for password confirmation
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  // Form for regenerate backup codes
  const regenerateForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  // Handle enabling 2FA
  const handleEnable2FA = () => {
    setShowSetup2FA(true);
  };

  // Handle 2FA setup completion
  const handleSetupComplete = () => {
    setShowSetup2FA(false);
  };

  // Handle 2FA setup cancellation
  const handleSetupCancel = () => {
    setShowSetup2FA(false);
  };

  // Handle disabling 2FA
  const handleDisable2FA = async (data: PasswordForm) => {
    try {
      await disable2FAMutation.mutateAsync(data);
      setShowDisable2FA(false);
      passwordForm.reset();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Handle regenerating backup codes
  const handleRegenerateBackupCodes = async (data: PasswordForm) => {
    try {
      const response = await regenerateBackupCodesMutation.mutateAsync(data);
      
      if (response && response.backupCodes) {
        setBackupCodes(response.backupCodes);
        setShowBackupCodes(true);
        setShowRegenerateDialog(false);
        regenerateForm.reset();
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    
    const codeText = backupCodes.join("\n");
    navigator.clipboard.writeText(codeText);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-[#00ebd6]">
            <Lock className="mr-2 h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security settings and two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account by requiring a verification code
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {user.twoFactorEnabled ? (
                  <div className="flex items-center">
                    <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
                    <Label htmlFor="two-factor-status" className="text-green-500">Enabled</Label>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ShieldAlert className="h-5 w-5 text-orange-500 mr-2" />
                    <Label htmlFor="two-factor-status" className="text-orange-500">Disabled</Label>
                  </div>
                )}
                <Switch
                  id="two-factor-status"
                  checked={user.twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnable2FA();
                    } else {
                      setShowDisable2FA(true);
                    }
                  }}
                  aria-readonly={setup2FAMutation.isPending || disable2FAMutation.isPending}
                />
              </div>
            </div>
            
            <p className="text-sm">
              {user.twoFactorEnabled
                ? "Two-factor authentication is currently enabled for your account. When you sign in, you'll need to provide a verification code from your authenticator app."
                : "With two-factor authentication, you'll need to provide a verification code from an authenticator app when signing in to provide extra security."}
            </p>
            
            {user.twoFactorEnabled && (
              <div className="pt-2">
                <Separator className="my-4" />
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Backup Codes
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Backup codes can be used to access your account if you lose your phone or cannot access your authenticator app.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateDialog(true)}
                  className="flex items-center text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 bg-slate-50 dark:bg-slate-900">
          <p className="text-xs text-gray-500">
            Last security update: {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Never'}
          </p>
        </CardFooter>
      </Card>

      {/* 2FA Setup Dialog */}
      {showSetup2FA && (
        <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <TwoFactorSetup 
              onSetupComplete={handleSetupComplete} 
              onCancel={handleSetupCancel} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#00ebd6]">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              You're about to disable two-factor authentication. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-300">
                Your account will no longer require a verification code when signing in. This reduces your account's security.
              </p>
            </div>
          </div>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handleDisable2FA)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Confirm your password to continue</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...passwordForm.register("password")}
                    className="pr-10"
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
                {passwordForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <DialogFooter>
                <div className="flex justify-end gap-2 w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowDisable2FA(false);
                      passwordForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={disable2FAMutation.isPending}
                  >
                    {disable2FAMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#00ebd6]">Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              Generate new backup codes for your account. This will invalidate all existing backup codes.
            </DialogDescription>
          </DialogHeader>
          <Form {...regenerateForm}>
            <form onSubmit={regenerateForm.handleSubmit(handleRegenerateBackupCodes)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regenerate-password">Confirm your password to continue</Label>
                <div className="relative">
                  <Input
                    id="regenerate-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...regenerateForm.register("password")}
                    className="pr-10"
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
                {regenerateForm.formState.errors.password && (
                  <p className="text-red-500 text-sm">{regenerateForm.formState.errors.password.message}</p>
                )}
              </div>
              <DialogFooter>
                <div className="flex justify-end gap-2 w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowRegenerateDialog(false);
                      regenerateForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                    disabled={regenerateBackupCodesMutation.isPending}
                  >
                    {regenerateBackupCodesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      "Generate New Codes"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Show Backup Codes Dialog */}
      <AlertDialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#00ebd6]">Your Backup Codes</AlertDialogTitle>
            <AlertDialogDescription>
              Store these backup codes in a safe place. Each code can only be used once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-[rgba(0,0,0,0.3)] p-3 rounded-md font-mono text-sm my-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-[rgba(0,0,0,0.2)] p-1 rounded text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 my-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-300">
                Keep these codes private. Anyone with these codes can access your account if 2FA is enabled.
              </p>
            </div>
          </div>
          
          <AlertDialogFooter>
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={copyBackupCodes}
              >
                Copy Codes
              </Button>
              <AlertDialogAction>
                Done
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SecuritySettings;