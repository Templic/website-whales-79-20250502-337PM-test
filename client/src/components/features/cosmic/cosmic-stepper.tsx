/**
 * cosmic-stepper.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, X } from 'lucide-react';
import CosmicHeading from './cosmic-heading';
import CosmicButton from './cosmic-button';

// Define variants for the step indicator
const stepIndicatorVariants = cva(
  'flex items-center justify-center rounded-full transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-gray-400 border border-gray-700',
        cosmic: 'bg-gray-900 text-cosmic-primary border border-cosmic-primary/40',
        nebula: 'bg-gray-900 text-purple-400 border border-purple-500/40',
        minimal: 'bg-gray-800 text-gray-300 border border-gray-700',
        glow: 'bg-gray-900 text-cosmic-primary border border-cosmic-primary/40 shadow-glow shadow-cosmic-primary/20',
      },
      size: {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
      },
      state: {
        inactive: 'opacity-50',
        active: 'opacity-100',
        completed: 'opacity-100',
        error: 'opacity-100 border-red-500/40 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'inactive',
    },
  }
);

// Define variants for the connector line
const connectorVariants = cva(
  'flex-1 h-px mx-2 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-gray-700',
        cosmic: 'bg-cosmic-primary/30',
        nebula: 'bg-purple-500/30',
        minimal: 'bg-gray-700',
        glow: 'bg-cosmic-primary/30 shadow-glow shadow-cosmic-primary/10',
      },
      state: {
        inactive: 'opacity-30',
        active: 'opacity-50',
        completed: 'opacity-100',
        error: 'opacity-100 bg-red-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'inactive',
    },
  }
);

// Define variants for the step content
const stepContentVariants = cva(
  'mt-4 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'text-gray-300',
        cosmic: 'text-gray-200',
        nebula: 'text-purple-100',
        minimal: 'text-gray-300',
        glow: 'text-cosmic-accent',
      },
      state: {
        inactive: 'opacity-50',
        active: 'opacity-100',
        completed: 'opacity-70',
        error: 'opacity-100 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'inactive',
    },
  }
);

// Step interface
export interface CosmicStepProps {
  id: string;
  title: string;
  description?: string;
  content?: React.ReactNode;
  optional?: boolean;
  error?: boolean;
  errorMessage?: string;
  onEnter?: () => void;
  onExit?: () => boolean | Promise<boolean>;
  validate?: () => boolean | Promise<boolean>;
}

// Main component interface
export interface CosmicStepperProps extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof stepIndicatorVariants> {
  steps: CosmicStepProps[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  orientation?: 'horizontal' | 'vertical';
  showStepNumbers?: boolean;
  showConnectors?: boolean;
  allowSkip?: boolean;
  allowNavigation?: boolean;
  validationMode?: 'onChange' | 'onNext' | 'onComplete' | 'none';
  completedIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  layout?: 'default' | 'minimal' | 'expanded';
  showControls?: boolean;
  controlLabels?: {
    next?: string;
    previous?: string;
    skip?: string;
    finish?: string;
  };
}

export const CosmicStepper = React.forwardRef<HTMLDivElement, CosmicStepperProps>(
  ({ 
    steps,
    currentStep,
    onStepChange,
    onComplete,
    orientation = 'horizontal',
    variant = 'default',
    size = 'md',
    showStepNumbers = true,
    showConnectors = true,
    allowSkip = false,
    allowNavigation = true,
    validationMode = 'onNext',
    completedIcon = <CheckCircle className="w-5 h-5" />,
    errorIcon = <X className="w-5 h-5" />,
    activeIcon,
    layout = 'default',
    showControls = true,
    controlLabels = {
      next: 'Next',
      previous: 'Back',
      skip: 'Skip',
      finish: 'Complete',
    },
    className,
    ...props
  }, ref) => {
    const [activeStep, setActiveStep] = useState<number>(currentStep || 0);
    const [stepStates, setStepStates] = useState<('inactive' | 'active' | 'completed' | 'error')[]>(
      steps.map((_, index) => index === currentStep ? 'active' : 'inactive')
    );
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Update the active step when currentStep prop changes
    useEffect(() => {
      if (currentStep !== undefined && currentStep !== activeStep) {
        setActiveStep(currentStep);

        // Update step states
        setStepStates(prev => 
          prev.map((state, idx) => 
            idx === currentStep 
              ? 'active' 
              : idx < currentStep 
                ? 'completed' 
                : 'inactive'
          )
        );
      }
    }, [currentStep]);

    // Handle step change
    const handleStepChange = async (newStep: number) => {
      if (newStep < 0 || newStep >= steps.length) return;

      const currentStepData = steps[activeStep];

      // Run validation if going forward
      if (newStep > activeStep && validationMode === 'onNext') {
        const isValid = currentStepData.validate ? await currentStepData.validate() : true;
        if (!isValid) {
          setStepStates(prev => {
            const updated = [...prev];
            updated[activeStep] = 'error';
            return updated;
          });
          setErrors(prev => ({
            ...prev,
            [currentStepData.id]: currentStepData.errorMessage || 'Validation failed'
          }));
          return;
        }
      }

      // Call onExit handler if present
      if (currentStepData.onExit) {
        const canExit = await currentStepData.onExit();
        if (!canExit) return;
      }

      // Call onEnter handler for the next step
      const nextStepData = steps[newStep];
      if (nextStepData.onEnter) {
        nextStepData.onEnter();
      }

      // Update states
      setActiveStep(newStep);
      setStepStates(prev => 
        prev.map((state, idx) => 
          idx === newStep 
            ? 'active' 
            : idx < newStep 
              ? 'completed' 
              : 'inactive'
        )
      );

      // Call the onStepChange handler
      if (onStepChange) {
        onStepChange(newStep);
      }
    };

    // Handle completing the stepper
    const handleComplete = async () => {
      // Run validation on the final step if needed
      if (validationMode === 'onComplete' || validationMode === 'onNext') {
        const currentStepData = steps[activeStep];
        const isValid = currentStepData.validate ? await currentStepData.validate() : true;

        if (!isValid) {
          setStepStates(prev => {
            const updated = [...prev];
            updated[activeStep] = 'error';
            return updated;
          });
          setErrors(prev => ({
            ...prev,
            [currentStepData.id]: currentStepData.errorMessage || 'Validation failed'
          }));
          return;
        }
      }

      // Set all steps to completed
      setStepStates(prev => prev.map(() => 'completed'));

      // Call the onComplete handler
      if (onComplete) {
        onComplete();
      }
    };

    // Determine if we're on the final step
    const isLastStep = activeStep === steps.length - 1;

    // Build step content
    const renderStepContent = () => {
      const currentStepData = steps[activeStep];
      return (
        <div 
          className={cn(
            stepContentVariants({ 
              variant, 
              state: stepStates[activeStep]
            }),
            'p-4'
          )}
        >
          {currentStepData.content}

          {/* Error message */}
          {stepStates[activeStep] === 'error' && errors[currentStepData.id] && (
            <div className="mt-2 text-red-400 text-sm">
              {errors[currentStepData.id]}
            </div>
          )}

          {/* Controls */}
          {showControls && (
            <div className={cn(
              "flex mt-6",
              orientation === 'horizontal' ? "justify-between" : "flex-col gap-3"
            )}>
              <div className="flex gap-2">
                {activeStep > 0 && (
                  <CosmicButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStepChange(activeStep - 1)}
                    disabled={!allowNavigation}
                  >
                    {controlLabels.previous}
                  </CosmicButton>
                )}

                {allowSkip && !isLastStep && steps[activeStep].optional && (
                  <CosmicButton 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleStepChange(activeStep + 1)}
                  >
                    {controlLabels.skip}
                  </CosmicButton>
                )}
              </div>

              <CosmicButton 
                variant="cosmic" 
                size="sm"
                onClick={isLastStep ? handleComplete : () => handleStepChange(activeStep + 1)}
              >
                {isLastStep ? controlLabels.finish : controlLabels.next}
              </CosmicButton>
            </div>
          )}
        </div>
      );
    };

    return (
      <div 
        ref={ref}
        className={cn(
          "w-full",
          orientation === 'horizontal' ? "flex flex-col" : "flex flex-row gap-4",
          className
        )}
        {...props}
      >
        {/* Step indicators */}
        <div className={cn(
          "flex",
          orientation === 'horizontal' ? "flex-row w-full justify-between" : "flex-col h-full items-start"
        )}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator with number or icon */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    stepIndicatorVariants({
                      variant,
                      size,
                      state: step.error ? 'error' : stepStates[index],
                    }),
                    allowNavigation && index !== activeStep && "cursor-pointer",
                    "z-10"
                  )}
                  onClick={() => allowNavigation && handleStepChange(index)}
                  aria-current={index === activeStep ? "step" : undefined}
                >
                  {stepStates[index] === 'completed' ? (
                    completedIcon
                  ) : stepStates[index] === 'error' ? (
                    errorIcon
                  ) : index === activeStep && activeIcon ? (
                    activeIcon
                  ) : (
                    showStepNumbers ? (
                      <span>{index + 1}</span>
                    ) : (
                      <Circle className="w-5 h-5" />
                    )
                  )}
                </div>

                {/* Step label - only shown when layout is not minimal */}
                {layout !== 'minimal' && (
                  <div 
                    className={cn(
                      "mt-2 text-center transition-all duration-300",
                      orientation === 'horizontal' ? "max-w-[120px]" : "max-w-full text-left ml-2",
                      stepStates[index] === 'active' ? "text-white font-medium" : "text-gray-400",
                      step.error && "text-red-400"
                    )}
                  >
                    <span className="text-sm font-medium">{step.title}</span>
                    {layout === 'expanded' && step.description && (
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector line between steps */}
              {showConnectors && index < steps.length - 1 && (
                <div 
                  className={cn(
                    connectorVariants({ 
                      variant, 
                      state: stepStates[index + 1] === 'error' 
                        ? 'error' 
                        : index < activeStep 
                          ? 'completed' 
                          : 'inactive' 
                    }),
                    orientation === 'vertical' && "w-px h-16 my-2 mx-0 ml-5"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className={cn(
          "w-full",
          orientation === 'horizontal' ? "mt-8" : "ml-4"
        )}>
          {renderStepContent()}
        </div>
      </div>
    );
  }
);

CosmicStepper.displayName = 'CosmicStepper';

export default CosmicStepper;