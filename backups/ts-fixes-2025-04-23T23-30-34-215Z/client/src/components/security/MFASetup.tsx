/**
 * MFA Setup Component
 * 
 * This component provides a user interface for setting up multi-factor
 * authentication, including TOTP (authenticator apps), recovery codes,
 * and other MFA methods.
 */import React from "react";
import React from "react";


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Smartphone, Lock, Mail, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// MFA setup states
enum SetupState {
  INITIAL = 'initial',
  PENDING = 'pending',
  QR_DISPLAYED = 'qr_displayed',
  VERIFICATION = 'verification',
  SUCCESS = 'success',
  ERROR = 'error'
}

// MFA methods available
enum MFAMethod {
  TOTP = 'totp',
  EMAIL = 'email',
  SMS = 'sms',
  RECOVERY = 'recovery'
}

// Props for the MFA setup component
interface MFASetupProps {
  userId: string | number;
  username: string;
  onSetupComplete?: (method: MFAMethod, success: boolean) => void;
}

export function MFASetup({ userId, username, onSetupComplete }: MFASetupProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<MFAMethod>(MFAMethod.TOTP);
  const [setupState, setSetupState] = useState<SetupState>(SetupState.INITIAL);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch any existing MFA status on component mount
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const response = await fetch(`/api/security/mfa/status/${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Handle the response based on user's current MFA status
        }
      } catch (error: unknown) {
        console.error('Failed to check MFA status:', error);
      }
    };

    checkMFAStatus();
  }, [userId]);

  // Handle MFA method selection
  const handleTabChange = (value: string) => {
    setActiveTab(value as MFAMethod);
    setSetupState(SetupState.INITIAL);
    setVerificationCode('');
    setError(null);
  };

  // Start the MFA setup process based on selected method
  const startSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case MFAMethod.TOTP:
          await setupTOTP();
          break;
        case MFAMethod.EMAIL:
          await setupEmail();
          break;
        case MFAMethod.SMS:
          await setupSMS();
          break;
        case MFAMethod.RECOVERY:
          await setupRecoveryCodes();
          break;
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'An error occurred during setup');
      setSetupState(SetupState.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup TOTP (Time-based One-Time Password)
  const setupTOTP = async () => {
    try {
      // Request TOTP setup from the server
      const response = await fetch(`/api/security/mfa/totp/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username })
      });

      if (!response.ok) throw new Error('Failed to set up TOTP');

      const data = await response.json();
      setQrCodeUrl(data.qrCode);
      setSecretKey(data.secret);
      setSetupState(SetupState.QR_DISPLAYED);
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to set up TOTP');
      setSetupState(SetupState.ERROR);
    }
  };

  // Setup Email verification
  const setupEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      // Request email code from the server
      const response = await fetch(`/api/security/mfa/email/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });

      if (!response.ok) throw new Error('Failed to send verification code');

      setSetupState(SetupState.VERIFICATION);
      toast({
        title: 'Verification code sent',
        description: 'Please check your email for the verification code',
      });
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to send verification code');
      setSetupState(SetupState.ERROR);
    }
  };

  // Setup SMS verification
  const setupSMS = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    try {
      // Request SMS code from the server
      const response = await fetch(`/api/security/mfa/sms/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, phoneNumber })
      });

      if (!response.ok) throw new Error('Failed to send verification code');

      setSetupState(SetupState.VERIFICATION);
      toast({
        title: 'Verification code sent',
        description: 'Please check your phone for the verification code',
      });
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to send verification code');
      setSetupState(SetupState.ERROR);
    }
  };

  // Generate recovery codes
  const setupRecoveryCodes = async () => {
    try {
      // Request recovery codes from the server
      const response = await fetch(`/api/security/mfa/recovery/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to generate recovery codes');

      const data = await response.json();
      setRecoveryCodes(data.recoveryCodes);
      setSetupState(SetupState.SUCCESS);
      
      if (onSetupComplete) {
        onSetupComplete(MFAMethod.RECOVERY, true);
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to generate recovery codes');
      setSetupState(SetupState.ERROR);
    }
  };

  // Verify the code entered by the user
  const verifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      let endpoint = '';
      let payload = {};
      
      switch (activeTab) {
        case MFAMethod.TOTP:
          endpoint = '/api/security/mfa/totp/verify';
          payload = { userId, token: verificationCode, secret: secretKey };
          break;
        case MFAMethod.EMAIL:
          endpoint = '/api/security/mfa/email/verify';
          payload = { userId, token: verificationCode, email };
          break;
        case MFAMethod.SMS:
          endpoint = '/api/security/mfa/sms/verify';
          payload = { userId, token: verificationCode, phoneNumber };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      setSetupState(SetupState.SUCCESS);
      toast({
        title: 'MFA setup successful',
        description: 'Multi-factor authentication has been enabled for your account',
      });

      if (onSetupComplete) {
        onSetupComplete(activeTab, true);
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different content based on the current setup state
  const renderSetupContent = () => {
    switch (setupState) {
      case SetupState.INITIAL:
        return renderInitialSetup();
      case SetupState.QR_DISPLAYED:
        return renderQRCode();
      case SetupState.VERIFICATION:
        return renderVerification();
      case SetupState.SUCCESS:
        return renderSuccess();
      case SetupState.ERROR:
        return renderError();
      default:
        return renderInitialSetup();
    }
  };

  // Render the initial setup screen
  const renderInitialSetup = () => {
    switch (activeTab) {
      case MFAMethod.TOTP:
        return (
          <div className="space-y-4">
            <p>
              Set up an authenticator app to generate verification codes for your account.
              This adds an extra layer of security by requiring both your password and a
              verification code from your app whenever you sign in.
            </p>
            <Button onClick={startSetup} disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Set up authenticator'}
            </Button>
          </div>
        );

      case MFAMethod.EMAIL:
        return (
          <div className="space-y-4">
            <p>
              Add email verification as a second layer of security. We'll send a code to your
              email address whenever you sign in.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                type="email"
              />
            </div>
            <Button onClick={startSetup} disabled={isLoading}>
              {isLoading ? 'Sending code...' : 'Send verification code'}
            </Button>
          </div>
        );

      case MFAMethod.SMS:
        return (
          <div className="space-y-4">
            <p>
              Add text message verification as a second layer of security. We'll send a code to
              your phone whenever you sign in.
            </p>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                type="tel"
              />
            </div>
            <Button onClick={startSetup} disabled={isLoading}>
              {isLoading ? 'Sending code...' : 'Send verification code'}
            </Button>
          </div>
        );

      case MFAMethod.RECOVERY:
        return (
          <div className="space-y-4">
            <p>
              Generate recovery codes to use as backup when you can't access your primary 
              verification method. Keep these codes in a safe place.
            </p>
            <Button onClick={startSetup} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate recovery codes'}
            </Button>
          </div>
        );
    }
  };

  // Render QR code for TOTP setup
  const renderQRCode = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <p className="mb-4">
            Scan this QR code with your authenticator app (like Google Authenticator, 
            Authy, or 1Password).
          </p>
          <div className="border p-3 rounded-lg mb-4">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse"></div>
            )}
          </div>
          <div className="w-full mb-4">
            <p className="text-sm text-center mb-2">
              If you can't scan the QR code, enter this code manually:
            </p>
            <div className="bg-gray-100 p-2 rounded text-center font-mono break-all">
              {secretKey}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Enter the code shown in your app</Label>
          <Input
            id="verificationCode"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={verifyCode} disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify code'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSetupState(SetupState.INITIAL)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // Render verification code entry
  const renderVerification = () => {
    return (
      <div className="space-y-4">
        <p>
          {activeTab === MFAMethod.EMAIL 
            ? 'We sent a verification code to your email. Enter it below to complete setup.'
            : 'We sent a verification code to your phone. Enter it below to complete setup.'}
        </p>
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Verification code</Label>
          <Input
            id="verificationCode"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            maxLength={6}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={verifyCode} disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify code'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSetupState(SetupState.INITIAL)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // Render success state
  const renderSuccess = () => {
    if (activeTab === MFAMethod.RECOVERY) {
      return (
        <div className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Recovery codes generated</AlertTitle>
            <AlertDescription>
              Save these codes in a secure place. You will need them if you lose access to your
              authentication device. Each code can only be used once.
            </AlertDescription>
          </Alert>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm">
            <ul className="space-y-1">
              {recoveryCodes.map((code, index) => (
                <li key={index} className="break-all">
                  {code}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-amber-600 text-sm">
            <strong>Important:</strong> Without these codes, you could be locked out of your account
            if you lose access to your authentication device. Please save them now.
          </p>
          <Button onClick={() => window.print()}>Print codes</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Setup successful</AlertTitle>
          <AlertDescription>
            {activeTab === MFAMethod.TOTP
              ? 'Authenticator app has been successfully configured.'
              : activeTab === MFAMethod.EMAIL
              ? 'Email verification has been successfully set up.'
              : 'SMS verification has been successfully set up.'}
          </AlertDescription>
        </Alert>
        <p>
          From now on, you'll need to provide a verification code when signing in to
          your account. This adds an extra layer of security to prevent unauthorized access.
        </p>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              // Reset the component
              setSetupState(SetupState.INITIAL);
              setVerificationCode('');
              setError(null);
            }}
          >
            Done
          </Button>
          <Button 
            variant="outline"
            onClick={() => setActiveTab(MFAMethod.RECOVERY)}
          >
            Set up recovery codes
          </Button>
        </div>
      </div>
    );
  };

  // Render error state
  const renderError = () => {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Setup failed</AlertTitle>
          <AlertDescription>
            {error || 'An error occurred during setup. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => {
            setSetupState(SetupState.INITIAL);
            setError(null);
          }}
        >
          Try again
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by enabling multi-factor authentication.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value={MFAMethod.TOTP} className="flex flex-col items-center py-2">
              <Smartphone className="h-4 w-4 mb-1" />
              <span className="text-xs">App</span>
            </TabsTrigger>
            <TabsTrigger value={MFAMethod.EMAIL} className="flex flex-col items-center py-2">
              <Mail className="h-4 w-4 mb-1" />
              <span className="text-xs">Email</span>
            </TabsTrigger>
            <TabsTrigger value={MFAMethod.SMS} className="flex flex-col items-center py-2">
              <PhoneCall className="h-4 w-4 mb-1" />
              <span className="text-xs">SMS</span>
            </TabsTrigger>
            <TabsTrigger value={MFAMethod.RECOVERY} className="flex flex-col items-center py-2">
              <Lock className="h-4 w-4 mb-1" />
              <span className="text-xs">Recovery</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={MFAMethod.TOTP} className="mt-4">
            {renderSetupContent()}
          </TabsContent>

          <TabsContent value={MFAMethod.EMAIL} className="mt-4">
            {renderSetupContent()}
          </TabsContent>

          <TabsContent value={MFAMethod.SMS} className="mt-4">
            {renderSetupContent()}
          </TabsContent>

          <TabsContent value={MFAMethod.RECOVERY} className="mt-4">
            {renderSetupContent()}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Multi-factor authentication helps protect your account from unauthorized access.
        </p>
      </CardFooter>
    </Card>
  );
}

export default MFASetup;