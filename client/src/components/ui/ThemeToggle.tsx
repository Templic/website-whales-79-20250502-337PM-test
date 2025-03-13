import { Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "system");
    root.classList.add(theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(current => {
      const themeOrder: Theme[] = ["light", "system", "dark"];
      const currentIndex = themeOrder.indexOf(current);
      return themeOrder[(currentIndex + 1) % themeOrder.length];
    });
  };

  return (
    <Button 
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="relative w-12 h-12 rounded-full bg-background border-2 border-primary shadow-lg hover:shadow-primary/50 transition-all duration-300"
    >
      <Sun className={`absolute inset-0 m-auto h-6 w-6 transition-all duration-300 ${theme !== 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute inset-0 m-auto h-6 w-6 transition-all duration-300 ${theme !== 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <SunMoon className={`absolute inset-0 m-auto h-6 w-6 transition-all duration-300 ${theme !== 'system' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}