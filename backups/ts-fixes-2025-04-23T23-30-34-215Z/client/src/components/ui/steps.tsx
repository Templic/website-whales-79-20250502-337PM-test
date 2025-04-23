import React from "react";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number;
}

export function Steps({
  currentStep = 0,
  className,
  ...props
}: StepsProps) {
  // Get all Step children
  const stepsCount = React.Children.count(props.children);
  
  return (
    <div className={cn("flex items-center w-full", className)} {...props}>
      {React.Children.map(props.children, (child, index) => {
        // Add props to child
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            step: index,
            currentStep,
            isLast: index === stepsCount - 1,
          } as StepProps);
        }
        return child;
      })}
    </div>
  );
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number;
  currentStep?: number;
  title?: string;
  isLast?: boolean;
}

export function Step({
  step = 0,
  currentStep = 0,
  title,
  isLast = false,
  ...props
}: StepProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  return (
    <div className="flex items-center w-full" {...props}>
      <div className="relative flex flex-col items-center text-teal-600">
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border transition-colors",
            isActive && "border-[#00ebd6] bg-[#00ebd6] text-[#303436]",
            isCompleted && "border-green-500 bg-green-500 text-white",
            !isActive && !isCompleted && "border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
          )}
        >
          {isCompleted ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            step + 1
          )}
        </div>
        {title && (
          <span
            className={cn(
              "absolute top-8 transform -translate-x-1/2 text-xs font-medium",
              isActive && "text-[#00ebd6]",
              isCompleted && "text-green-500",
              !isActive && !isCompleted && "text-gray-500 dark:text-gray-400"
            )}
            style={{ left: '50%', width: 'max-content' }}
          >
            {title}
          </span>
        )}
      </div>
      {!isLast && (
        <div className="flex-auto border-t dark:border-gray-700 transition-colors">
          <div
            className={cn(
              "border-t border-teal-600 dark:border-teal-400 h-0",
              isCompleted ? "w-full" : "w-0",
              !isActive && !isCompleted ? "border-gray-300 dark:border-gray-600" : ""
            )}
            style={{ transform: "translate(0, -100%)" }}
          />
        </div>
      )}
    </div>
  );
}