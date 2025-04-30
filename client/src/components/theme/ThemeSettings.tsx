/**
 * Theme Settings Component
 * 
 * This component provides controls for theme-related settings like:
 * - Light/Dark/System mode toggle
 * - Font size preference
 * - Reduced motion preference
 * - Contrast settings
 * 
 * It's designed to be embedded in various parts of the UI where theme settings are needed.
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSettingsProps {
  compact?: boolean;
  showTitle?: boolean;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ 
  compact = false,
  showTitle = true
}) => {
  const { themeMode, setThemeMode } = useTheme();
  
  return (
    <Card className={compact ? 'p-2' : ''}>
      {showTitle && (
        <CardHeader className={compact ? 'p-2 pb-1' : ''}>
          <CardTitle className={compact ? 'text-lg' : 'text-xl'}>Appearance</CardTitle>
          <CardDescription>Customize how the application looks for you</CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={compact ? 'p-2 pt-1' : ''}>
        <div className="space-y-4">
          {/* Theme mode selection */}
          <div className="space-y-2">
            <Label htmlFor="theme-mode">Theme mode</Label>
            <RadioGroup 
              id="theme-mode" 
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as 'light' | 'dark' | 'system')}
              className="grid grid-cols-3 gap-2"
            >
              <Label
                htmlFor="theme-light"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  themeMode === 'light' ? 'border-primary' : 'border-muted'
                } cursor-pointer`}
              >
                <RadioGroupItem
                  value="light"
                  id="theme-light"
                  className="sr-only"
                />
                <Sun className="mb-2 h-6 w-6" />
                <span className="text-xs">Light</span>
              </Label>
              
              <Label
                htmlFor="theme-dark"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  themeMode === 'dark' ? 'border-primary' : 'border-muted'
                } cursor-pointer`}
              >
                <RadioGroupItem
                  value="dark"
                  id="theme-dark"
                  className="sr-only"
                />
                <Moon className="mb-2 h-6 w-6" />
                <span className="text-xs">Dark</span>
              </Label>
              
              <Label
                htmlFor="theme-system"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  themeMode === 'system' ? 'border-primary' : 'border-muted'
                } cursor-pointer`}
              >
                <RadioGroupItem
                  value="system"
                  id="theme-system"
                  className="sr-only"
                />
                <Laptop className="mb-2 h-6 w-6" />
                <span className="text-xs">System</span>
              </Label>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;