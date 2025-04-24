
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function StripeConfigDialog() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const response = await fetch('/api/admin/stripe-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishableKey: formData.get('publishableKey'),
          secretKey: formData.get('secretKey'),
        }),
      });

      if (!response.ok) throw new Error('Failed to update Stripe configuration');
      
      setMessage('Stripe configuration updated successfully');
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError('Failed to update Stripe configuration. Please try again.');
    }
  };

  return (
    <Card className="w-[450px] mx-auto">
      <CardHeader>
        <CardTitle>Stripe Configuration</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label htmlFor="publishableKey" className="text-sm font-medium">
              Publishable Key
            </label>
            <Input 
              id="publishableKey"
              name="publishableKey" 
              placeholder="pk_test_..."
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="secretKey" className="text-sm font-medium">
              Secret Key
            </label>
            <Input
              id="secretKey"
              name="secretKey"
              type="password"
              placeholder="sk_test_..."
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Save Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
