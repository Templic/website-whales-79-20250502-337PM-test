/**
 * MFA Challenge Component
 * 
 * This component handles the verification step when MFA is required during login.
 * It supports different MFA methods (TOTP, email, SMS, recovery codes).
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, HelpCircle, KeyRound, SmartphoneIcon, Mail, KeyIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Types of MFA challenges
export enum MFAChallengeType {
  TOTP = 'totp',
  EMAIL = 'email',
  SMS = 'sms',
  RECOVERY = 'recovery'
}

// Challenge states
enum ChallengeState {
  READY = 'ready',         // Initial state
  PENDING = 'pending',     // Waiting for server response
  SUCCESS = 'success',     // Successfully verified
  ERROR = 'error',         // Error occurred
  RECOVERY = 'recovery'    // Switched to recovery mode
}

interface MFAChallengeProps {
  userId: string | number;
  challengeType: MFAChallengeType;
  phoneNumber?: string;    // If SMS is used (partially masked)
  email?: string;          // If email is used (partially masked)
  onComplete: (success: boolean) => void;
  onSendNewCode?: () => Promise<boolean>;
  onRequestRecovery?: () => void;
}

export function MFAChallenge({
  userId,
  challengeType,
  phoneNumber,
  email,
  onComplete,
  onSendNewCode,
  onRequestRecovery
}: MFAChallengeProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [state, setState] = useState<ChallengeState>(ChallengeState.READY);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendDisabled, setResendDisabled] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>(challengeType);

  // Countdown timer for resending codes
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [resendCountdown, resendDisabled]);

  // Handle verification code submission
  const handleVerify = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Choose API endpoint based on the challenge type
      let endpoint = '';
      let payload = {};

      switch (challengeType) {
        case MFAChallengeType.TOTP:
          endpoint = '/api/security/mfa/totp/authenticate';
          payload = { userId, token: verificationCode };
          break;
        case MFAChallengeType.EMAIL:
          endpoint = '/api/security/mfa/email/authenticate';
          payload = { userId, token: verificationCode };
          break;
        case MFAChallengeType.SMS:
          endpoint = '/api/security/mfa/sms/authenticate';
          payload = { userId, token: verificationCode };
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

      setState(ChallengeState.SUCCESS);
      toast({
        title: 'Authentication successful',
        description: 'You have successfully verified your identity',
      });

      // Notify parent component
      onComplete(true);
    } catch (error: unknown) {
      setError((error as Error).message || 'Verification failed. Please try again.');
      setState(ChallengeState.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recovery code submission
  const handleRecoveryVerify = async () => {
    if (!recoveryCode) {
      setError('Please enter a recovery code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security/mfa/recovery/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, recoveryCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Recovery code verification failed');
      }

      setState(ChallengeState.SUCCESS);
      toast({
        title: 'Recovery successful',
        description: 'You have successfully authenticated using a recovery code',
      });

      // Notify parent component
      onComplete(true);
    } catch (error: unknown) {
      setError((error as Error).message || 'Verification failed. Please try again.');
      setState(ChallengeState.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle request for a new code
  const handleResendCode = async () => {
    if (!onSendNewCode) return;
    
    setIsLoading(true);
    
    try {
      const success = await onSendNewCode();
      
      if (success) {
        toast({
          title: 'Code sent',
          description: challengeType === MFAChallengeType.EMAIL
            ? 'A new verification code has been sent to your email'
            : 'A new verification code has been sent to your phone',
        });
        
        // Disable resend button for 60 seconds
        setResendDisabled(true);
        setResendCountdown(60);
      } else {
        throw new Error('Failed to send a new code');
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to send a new code');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to recovery mode
  const switchToRecovery = () => {
    setActiveTab(MFAChallengeType.RECOVERY);
    setState(ChallengeState.RECOVERY);
    setError(null);
  };

  // Get challenge description based on type
  const getChallengeDescription = () => {
    switch (challengeType) {
      case MFAChallengeType.TOTP:
        return 'Enter the verification code from your authenticator app.';
      case MFAChallengeType.EMAIL:
        return `Enter the verification code sent to your email ${email || ''}`;
      case MFAChallengeType.SMS:
        return `Enter the verification code sent to your phone ${phoneNumber || ''}`;
      default:
        return 'Enter your verification code.';
    }
  };

  // Get icon based on challenge type
  const getChallengeIcon = () => {
    switch (challengeType) {
      case MFAChallengeType.TOTP:
        return <SmartphoneIcon className="h-6 w-6 mb-2" />;
      case MFAChallengeType.EMAIL:
        return <Mail className="h-6 w-6 mb-2" />;
      case MFAChallengeType.SMS:
        return <SmartphoneIcon className="h-6 w-6 mb-2" />;
      case MFAChallengeType.RECOVERY:
        return <KeyIcon className="h-6 w-6 mb-2" />;
      default:
        return <KeyRound className="h-6 w-6 mb-2" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          {getChallengeIcon()}
          <span>Two-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          For added security, please complete the authentication.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {(challengeType === MFAChallengeType.TOTP || 
          challengeType === MFAChallengeType.EMAIL || 
          challengeType === MFAChallengeType.SMS) && (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value={challengeType}>Verification</TabsTrigger>
              <TabsTrigger value={MFAChallengeType.RECOVERY}>Recovery</TabsTrigger>
            </TabsList>

            <TabsContent value={challengeType} className="mt-4 space-y-4">
              <p>{getChallengeDescription()}</p>
              
              {state === ChallengeState.ERROR && error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={handleVerify} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
                
                {(challengeType === MFAChallengeType.EMAIL || challengeType === MFAChallengeType.SMS) && (
                  <Button 
                    variant="outline" 
                    onClick={handleResendCode}
                    disabled={isLoading || resendDisabled}
                  >
                    {resendDisabled
                      ? `Resend code (${resendCountdown}s)`
                      : 'Resend code'}
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={switchToRecovery}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <span>I can't access my verification method</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value={MFAChallengeType.RECOVERY} className="mt-4 space-y-4">
              <p>
                Enter one of your recovery codes. Each code can only be used once.
              </p>
              
              {state === ChallengeState.ERROR && error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="recoveryCode">Recovery code</Label>
                <Input
                  id="recoveryCode"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="font-mono text-center"
                />
              </div>
              
              <Button onClick={handleRecoveryVerify} disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Use recovery code'}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {/* For recovery-only mode */}
        {challengeType === MFAChallengeType.RECOVERY && (
          <div className="space-y-4">
            <p>
              Enter one of your recovery codes. Each code can only be used once.
            </p>
            
            {state === ChallengeState.ERROR && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="recoveryCode">Recovery code</Label>
              <Input
                id="recoveryCode"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="font-mono text-center"
              />
            </div>
            
            <Button onClick={handleRecoveryVerify} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Use recovery code'}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {activeTab === MFAChallengeType.RECOVERY
            ? 'Using recovery codes will log you in and disable your existing 2FA method. You will need to set up 2FA again.'
            : 'Two-factor authentication provides additional security by requiring a second verification step to log in.'}
        </p>
      </CardFooter>
    </Card>
  );
}

export default MFAChallenge;