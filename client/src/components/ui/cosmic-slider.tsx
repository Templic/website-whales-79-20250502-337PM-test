import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface CosmicSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: "default" | "cosmic" | "success" | "warning" | "danger" | "primary";
  showValue?: boolean;
  formatValue?: (value: number[]) => string;
}

export const CosmicSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  CosmicSliderProps
>(({ 
  className, 
  variant = "default", 
  showValue = false, 
  formatValue = (value) => value.join(" - "),
  ...props 
}, ref) => {
  const variantClasses = {
    default: "bg-primary",
    cosmic: "bg-cosmic-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    primary: "bg-blue-500"
  };

  return (
    <div className="space-y-2">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className={cn("absolute h-full", variantClasses[variant])} />
        </SliderPrimitive.Track>
        {props.value?.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
      {showValue && props.value && (
        <div className="text-center text-xs text-muted-foreground">
          {formatValue(props.value)}
        </div>
      )}
    </div>
  );
});

CosmicSlider.displayName = "CosmicSlider";

export default CosmicSlider;