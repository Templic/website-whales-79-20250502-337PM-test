import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  date,
  setDate,
  id,
  className = "",
  placeholder = "Select date"
}: DatePickerProps) {
  return (
    <div className={`relative ${className}`}>
      <Input
        id={id}
        type="date"
        placeholder={placeholder}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            setDate(new Date(value));
          } else {
            setDate(undefined);
          }
        }}
        className="pl-10"
      />
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}