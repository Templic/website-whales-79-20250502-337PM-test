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
      className="relative w-10 h-10 border-2 border-primary bg-background hover:bg-accent hover:text-accent-foreground"
    >
      <Sun className={`h-5 w-5 transition-all ${theme !== 'light' ? 'hidden' : ''}`} />
      <Moon className={`h-5 w-5 transition-all ${theme !== 'dark' ? 'hidden' : ''}`} />
      <SunMoon className={`h-5 w-5 transition-all ${theme !== 'system' ? 'hidden' : ''}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}