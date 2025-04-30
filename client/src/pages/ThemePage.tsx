/**
 * Theme Page
 * 
 * The main page for the theme management system.
 * It provides access to the theme manager and theme preview.
 */

import React, { useState } from 'react';
import { ThemeManager } from '@/components/theme/ThemeManager';
import { useTheme } from '@shared/theme/ThemeContext';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const ThemePage = () => {
  const { tokens, mode, setMode } = useTheme();
  const [userId] = useState(1); // This would come from auth context in a real app

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Harmonize Theme System</h1>
          <p className="text-muted-foreground">
            Create, manage, and apply themes to customize your application's appearance
          </p>
        </div>

        <Tabs defaultValue="manager">
          <TabsList className="mb-6">
            <TabsTrigger value="manager">Theme Manager</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="manager">
            <ThemeManager 
              userId={userId}
              showMyThemesOnly={true}
              canCreate={true}
              canEdit={true}
              canDelete={true}
              canApply={true}
            />
          </TabsContent>

          <TabsContent value="preview">
            <ThemePreview />
          </TabsContent>
          
          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Harmonize Theme System Documentation</CardTitle>
                <CardDescription>
                  Learn how to use the Harmonize Theme System to customize your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-8">
                    <section>
                      <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                      <p className="mb-4">
                        The Harmonize Theme System is a comprehensive solution for creating, managing, and applying themes
                        to your application. It provides a user-friendly interface for customizing the appearance of your
                        application while ensuring consistency and accessibility.
                      </p>
                      <p>
                        Built with a focus on privacy and open-source technologies, Harmonize uses a design token approach
                        that separates design decisions from implementation details, making it flexible and maintainable.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold mb-4">Key Features</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Design token system for consistent theming across components</li>
                        <li>Light, dark, and high contrast modes with accessibility features</li>
                        <li>Theme persistence and sharing capabilities</li>
                        <li>Component-level styling control</li>
                        <li>Theme preview and live editing</li>
                        <li>Theme versioning and history</li>
                        <li>Privacy-focused implementation without third-party services</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
                      <ol className="list-decimal pl-6 space-y-4">
                        <li>
                          <h3 className="font-bold">Browse Existing Themes</h3>
                          <p>
                            Start by exploring the available themes in the Theme Manager. You can view details of each theme
                            and see how they look when applied to components.
                          </p>
                        </li>
                        <li>
                          <h3 className="font-bold">Apply a Theme</h3>
                          <p>
                            When you find a theme you like, click "View" and then "Apply Theme" to see it in action. You can
                            test different themes without making permanent changes.
                          </p>
                        </li>
                        <li>
                          <h3 className="font-bold">Create Your Own Theme</h3>
                          <p>
                            Click "Create Theme" to design your own custom theme. Start with a base theme (light or dark) and
                            modify the colors, typography, spacing, and other design tokens.
                          </p>
                        </li>
                        <li>
                          <h3 className="font-bold">Save and Share</h3>
                          <p>
                            Once you're happy with your theme, save it and optionally make it public for others to use. You
                            can also export themes as JSON for use in other applications.
                          </p>
                        </li>
                      </ol>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold mb-4">Theme Structure</h2>
                      <p className="mb-4">
                        Harmonize themes are built around a token-based system that defines the visual properties of the UI.
                        These tokens are organized into categories:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold">Colors</h3>
                          <p>Base colors, background, foreground, primary, secondary, and semantic colors</p>
                        </div>
                        <div>
                          <h3 className="font-bold">Typography</h3>
                          <p>Font families, sizes, weights, line heights, and letter spacing</p>
                        </div>
                        <div>
                          <h3 className="font-bold">Spacing</h3>
                          <p>Margin, padding, and layout spacing values</p>
                        </div>
                        <div>
                          <h3 className="font-bold">Border Radius</h3>
                          <p>Corner radius values for different UI elements</p>
                        </div>
                        <div>
                          <h3 className="font-bold">Shadows</h3>
                          <p>Box shadow definitions for elevation and depth</p>
                        </div>
                        <div>
                          <h3 className="font-bold">Components</h3>
                          <p>Component-specific styling tokens for buttons, cards, inputs, etc.</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold mb-4">Accessibility</h2>
                      <p className="mb-4">
                        Harmonize is designed with accessibility in mind. All themes are evaluated for contrast ratios and
                        readability to ensure they meet WCAG standards. The system includes:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Contrast checking for text and UI elements</li>
                        <li>Support for high contrast mode</li>
                        <li>Reduced motion options</li>
                        <li>Keyboard navigation support</li>
                        <li>Screen reader compatibility</li>
                      </ul>
                      <p className="mt-4">
                        When creating themes, aim for color combinations that provide sufficient contrast and consider users
                        with various visual impairments.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold mb-4">For Developers</h2>
                      <p className="mb-4">
                        Developers can integrate Harmonize into their applications using the provided components and APIs:
                      </p>
                      <div className="bg-muted p-4 rounded-md mb-4 overflow-x-auto">
                        <pre className="text-sm">
                          <code>
{`// Import the ThemeContext and provider
import { ThemeProvider, useTheme } from '@shared/theme/ThemeContext';

// Wrap your application with the provider
<ThemeProvider>
  <App />
</ThemeProvider>

// Use the theme in components
const MyComponent = () => {
  const { tokens, mode, setMode } = useTheme();
  
  return (
    <div style={{ backgroundColor: tokens.colors.background }}>
      <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
};`}
                          </code>
                        </pre>
                      </div>
                      <p>
                        The theme system also integrates with Tailwind CSS through a plugin that makes theme tokens available
                        as Tailwind classes. This allows for consistent styling across the application.
                      </p>
                    </section>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Theme Preview Component
function ThemePreview() {
  const { tokens, mode, setMode } = useTheme();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preview</CardTitle>
        <CardDescription>
          See how the current theme affects different UI components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Current Theme Mode</h3>
            <p className="text-muted-foreground">Toggle between light and dark mode</p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme-mode">Dark Mode</Label>
            <Switch 
              id="theme-mode"
              checked={mode === 'dark'} 
              onCheckedChange={() => setMode(mode === 'light' ? 'dark' : 'light')}
            />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold mb-4">Typography</h3>
            <div className="space-y-3">
              <div>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Heading 1
                </h1>
                <p className="text-sm text-muted-foreground">text-4xl font-extrabold</p>
              </div>
              <div>
                <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                  Heading 2
                </h2>
                <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
              </div>
              <div>
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  Heading 3
                </h3>
                <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
              </div>
              <div>
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  Heading 4
                </h4>
                <p className="text-sm text-muted-foreground">text-xl font-semibold</p>
              </div>
              <div>
                <p className="leading-7">
                  This is a paragraph of text. It demonstrates the default text style and line height.
                  The quick brown fox jumps over the lazy dog.
                </p>
                <p className="text-sm text-muted-foreground">leading-7</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  This is smaller muted text often used for descriptions or less important information.
                </p>
                <p className="text-sm text-muted-foreground">text-sm text-muted-foreground</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <Button>Default Button</Button>
                <p className="text-sm text-muted-foreground mt-1">Button</p>
              </div>
              <div>
                <Button variant="secondary">Secondary</Button>
                <p className="text-sm text-muted-foreground mt-1">variant="secondary"</p>
              </div>
              <div>
                <Button variant="destructive">Destructive</Button>
                <p className="text-sm text-muted-foreground mt-1">variant="destructive"</p>
              </div>
              <div>
                <Button variant="outline">Outline</Button>
                <p className="text-sm text-muted-foreground mt-1">variant="outline"</p>
              </div>
              <div>
                <Button variant="ghost">Ghost</Button>
                <p className="text-sm text-muted-foreground mt-1">variant="ghost"</p>
              </div>
              <div>
                <Button variant="link">Link</Button>
                <p className="text-sm text-muted-foreground mt-1">variant="link"</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Enter your email" />
                <p className="text-sm text-muted-foreground">Input component</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="switch">Toggle Switch</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="switch" />
                  <span>Notifications</span>
                </div>
                <p className="text-sm text-muted-foreground">Switch component</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the content of the card. It can contain any elements.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button className="ml-2">Submit</Button>
                </CardFooter>
              </Card>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-card text-card-foreground">
                  <h4 className="font-semibold">Simple Card</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    A simpler card using border, bg-card and text-card-foreground
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-secondary text-secondary-foreground">
                  <h4 className="font-semibold">Secondary Card</h4>
                  <p className="text-sm mt-1">
                    Uses the secondary color variation
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4">Badges</h3>
            <div className="flex flex-wrap gap-3">
              <div>
                <Badge>Default</Badge>
                <p className="text-sm text-muted-foreground mt-1">Badge</p>
              </div>
              <div>
                <Badge variant="secondary">Secondary</Badge>
                <p className="text-sm text-muted-foreground mt-1">variant="secondary"</p>
              </div>
              <div>
                <Badge variant="outline">Outline</Badge>
                <p className="text-sm text-muted-foreground mt-1">variant="outline"</p>
              </div>
              <div>
                <Badge variant="destructive">Destructive</Badge>
                <p className="text-sm text-muted-foreground mt-1">variant="destructive"</p>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThemePage;