import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onSelect: (range: { from: Date; to: Date } | undefined) => void;
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
  const [date, setDate] = React.useState<{
    from: Date;
    to: Date;
  }>({
    from,
    to,
  });

  const handleSelect = (selectedDate: Date | undefined) => {
    // Reset the selection if we have a complete range
    if (date.from && date.to) {
      setDate({
        from: selectedDate || new Date(),
        to: selectedDate || new Date(),
      });
      return;
    }

    // If we have a "from" date, set the "to" date
    if (date.from && !date.to && selectedDate && selectedDate > date.from) {
      const newRange = { from: date.from, to: selectedDate };
      setDate(newRange);
      onSelect(newRange);
      return;
    }

    // Set the "from" date
    setDate({
      from: selectedDate || new Date(),
      to: selectedDate || new Date(),
    });
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className="w-[300px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
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
            mode="range"
            defaultMonth={date.from}
            selected={{
              from: date.from,
              to: date.to,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDate({ from: range.from, to: range.to });
                onSelect(range);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}