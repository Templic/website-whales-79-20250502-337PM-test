
import * as React from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onSelect: (range: { from: Date; to: Date } | undefined) => void;
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange>({
    from,
    to,
  });

  // Predefined date ranges
  const predefinedRanges = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ];

  // Handle predefined range selection
  const handleRangeClick = (days: number) => {
    const to = new Date();
    const from = addDays(to, -days);
    setDate({ from, to });
    onSelect({ from, to });
  };

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_1fr] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-2">
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                setDate(range || { from: undefined, to: undefined });
                if (range?.from && range?.to) {
                  onSelect({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center justify-center">
        <span className="text-sm text-muted-foreground">or</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {predefinedRanges.map((range) => (
          <Button
            key={range.days}
            variant="outline"
            className="w-full"
            onClick={() => handleRangeClick(range.days)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}