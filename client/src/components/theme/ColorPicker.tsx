/**
 * Color Picker Component
 * 
 * A simple color picker component for selecting colors in the theme editor.
 * Uses HTML5 color input with a custom UI.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
}

export function ColorPicker({
  value,
  onChange,
  presetColors = [
    '#000000', '#ffffff', '#f44336', '#e91e63', 
    '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', 
    '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
    '#ff9800', '#ff5722', '#795548', '#607d8b'
  ]
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only trigger onChange for valid color values
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newValue) || 
        /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(newValue) ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(newValue) ||
        /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(newValue) ||
        /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/i.test(newValue)) {
      onChange(newValue);
    }
  };

  // Handle blur events to ensure the input matches the current color
  const handleBlur = () => {
    setInputValue(value);
  };

  // Handle preset color selection
  const handlePresetSelect = (presetColor: string) => {
    onChange(presetColor);
    setInputValue(presetColor);
    setIsOpen(false);
  };

  // Handle native color picker changes
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // Open native color picker when clicking the swatch
  const handleSwatchClick = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div
        className="h-8 w-8 rounded-md border cursor-pointer"
        style={{ backgroundColor: value }}
        onClick={handleSwatchClick}
      />
      
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="flex-1"
      />
      
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={handleColorPickerChange}
        className="sr-only"
      />
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
          >
            <span className="sr-only">Open color presets</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a7 7 0 0 0-7 7c0 2.1 2 3.4 4 5s2 3.9 3 3.9c1 0 1-1.5 3-3.5s4-3 4-5.1a7 7 0 0 0-7-7.3Z" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-2">
            <Label>Preset Colors</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={`h-6 w-6 rounded-md border ${presetColor === value ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handlePresetSelect(presetColor)}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}