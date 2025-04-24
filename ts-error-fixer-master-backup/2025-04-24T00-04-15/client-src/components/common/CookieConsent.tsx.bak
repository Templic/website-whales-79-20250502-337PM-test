/**
 * CookieConsent.tsx
 * 
 * A reusable cookie consent banner component that helps comply with
 * GDPR, CCPA, and other privacy regulations. This component displays
 * a banner at the bottom of the page asking for user consent to cookies.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

/**
 * Types of cookie preferences that users can configure
 */
type CookiePreferences = {
  essential: boolean; // Always true, can't be toggled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: false,
};

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  // Check if user has already set cookie preferences
  useEffect(() => {
    const consentGiven = localStorage.getItem('cookie-consent');
    if (!consentGiven) {
      setShowBanner(true);
    }
  }, []);

  // Save cookie preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    
    // Here you would implement actual cookie management based on preferences
    // For example, disabling tracking cookies if analytics is false
  };

  // Accept all cookies
  const acceptAll = () => {
    setPreferences({
      ...preferences,
      functional: true,
      analytics: true,
      marketing: true,
    });
    
    savePreferences();
  };

  // Accept only essential cookies
  const acceptEssential = () => {
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    
    savePreferences();
  };

  // Update individual preference
  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Essential cookies can't be toggled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
      {!showPreferences ? (
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">We Value Your Privacy</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies. Visit our{' '}
              <Link href="/privacy" className="underline text-primary">
                Privacy Policy
              </Link>{' '}
              to learn more.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              Customize
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={acceptEssential}
            >
              Essential Only
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={acceptAll}
            >
              Accept All
            </Button>
          </div>
        </div>
      ) : (
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Cookie Preferences</CardTitle>
            <CardDescription>
              Customize your cookie preferences below. Essential cookies are required for the website to function properly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Essential Cookies</h4>
                  <p className="text-sm text-muted-foreground">Required for the website to function. Cannot be disabled.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.essential} 
                  disabled
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Functional Cookies</h4>
                  <p className="text-sm text-muted-foreground">Enable personalized features and remember your preferences.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.functional} 
                  onChange={() => togglePreference('functional')}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">Help us understand how visitors interact with our website.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.analytics} 
                  onChange={() => togglePreference('analytics')}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className="text-sm text-muted-foreground">Track your browsing habits to deliver targeted advertising.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.marketing} 
                  onChange={() => togglePreference('marketing')}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowPreferences(false)}
            >
              Back
            </Button>
            <Button 
              variant="default"
              onClick={savePreferences}
            >
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CookieConsent;