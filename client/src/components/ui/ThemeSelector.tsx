/**
 * ThemeSelector.tsx
 * 
 * Component Type: ui
 * A visual theme selector that allows users to choose between light, dark, and blackout themes
 */
import { CircleDot, Moon, Sun, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { useTheme } from "./ThemeProvider";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid flash of incorrect theme while loading
  if (!mounted) {
    return <div className="w-full h-12" />;
  }

  // Function to change theme
  const setThemeMode = (newTheme: string) => {
    setTheme(newTheme as any); // Type is safe because we're only passing valid theme values
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <p className="text-sm font-medium text-muted-foreground mb-2">Choose Theme</p>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Light theme option */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThemeMode("light")}
          className={`relative flex flex-col items-center justify-center h-20 p-2 border-2 ${
            theme === "light" ? "border-yellow-300" : "border-muted"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mb-1">
            <Sun className="h-5 w-5 text-yellow-600" />
          </div>
          <span className="text-xs">Light</span>
          {theme === "light" && (
            <div className="absolute top-1 right-1">
              <Check className="h-3 w-3 text-primary" />
            </div>
          )}
        </Button>
        
        {/* Dark theme option */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThemeMode("dark")}
          className={`relative flex flex-col items-center justify-center h-20 p-2 border-2 ${
            theme === "dark" ? "border-blue-400" : "border-muted"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center mb-1">
            <Moon className="h-5 w-5 text-blue-300" />
          </div>
          <span className="text-xs">Dark</span>
          {theme === "dark" && (
            <div className="absolute top-1 right-1">
              <Check className="h-3 w-3 text-primary" />
            </div>
          )}
        </Button>
        
        {/* Blackout theme option */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThemeMode("blackout")}
          className={`relative flex flex-col items-center justify-center h-20 p-2 border-2 ${
            theme === "blackout" ? "border-purple-500" : "border-muted"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mb-1">
            <CircleDot className="h-5 w-5 text-purple-500" />
          </div>
          <span className="text-xs">Blackout</span>
          {theme === "blackout" && (
            <div className="absolute top-1 right-1">
              <Check className="h-3 w-3 text-primary" />
            </div>
          )}
        </Button>
      </div>
      
      {/* Responsive theme selector hint */}
      <div className="text-xs text-muted-foreground text-center mt-1">
        <p className="hidden md:block">Customize your experience with different theme modes</p>
        <p className="block md:hidden">Swipe to view all themes</p>
      </div>
    </div>
  );
}