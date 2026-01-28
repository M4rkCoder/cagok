import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  getYear,
  getMonth,
  setMonth,
  setYear,
  setDefaultOptions,
  addYears,
  subYears,
  subMonths,
  addMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

setDefaultOptions({ locale: ko });

interface MonthYearPickerProps {
  selectedMonth: string; // "YYYY-MM" format
  onMonthChange: (newMonth: string) => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date()); // Internal state for the picker

  useEffect(() => {
    if (selectedMonth) {
      setPickerDate(new Date(`${selectedMonth}-01`));
    }
  }, [selectedMonth]);

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year, 10);
    const newDate = setYear(pickerDate, newYear);
    setPickerDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(pickerDate, monthIndex);
    setPickerDate(newDate);
    onMonthChange(format(newDate, "yyyy-MM")); // Only update when month is selected
    setPopoverOpen(false); // Close popover after month selection
  };

  const handlePreviousYear = () => {
    const newDate = subYears(pickerDate, 1);
    setPickerDate(newDate);
    // onMonthChange(format(newDate, "yyyy-MM")); // Only update on month selection
  };

  const handlePreviousMonth = () => {
    const currentMonthDate = new Date(`${selectedMonth}-01`);
    const previousMonthDate = subMonths(currentMonthDate, 1);
    onMonthChange(format(previousMonthDate, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const currentMonthDate = new Date(`${selectedMonth}-01`);
    const nextMonthDate = addMonths(currentMonthDate, 1);
    onMonthChange(format(nextMonthDate, "yyyy-MM"));
  };

  const handleNextYear = () => {
    const newDate = addYears(pickerDate, 1);
    setPickerDate(newDate);
    // onMonthChange(format(newDate, "yyyy-MM")); // Only update on month selection
  };

  // Generate years for the select dropdown: current year +/- 5 years
  const years = Array.from(
    { length: 11 },
    (_, i) => getYear(new Date()) - 5 + i
  );

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-[150px] justify-center text-center font-semibold"
          >
            {selectedMonth ? (
              format(new Date(`${selectedMonth}-01`), "yyyy년 M월")
            ) : (
              <span>월 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex flex-col space-y-2">
            {/* Year Selection */}
            <div className="flex items-center justify-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePreviousYear}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Select
                value={getYear(pickerDate).toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="연도" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleNextYear}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Month Selection */}
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = setMonth(pickerDate, i); // Use pickerDate's year
                const monthName = format(monthDate, "MMM", { locale: ko });
                return (
                  <Button
                    key={i}
                    variant={getMonth(pickerDate) === i ? "default" : "ghost"}
                    onClick={() => handleMonthSelect(i)}
                    className="w-full"
                  >
                    {monthName}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={handleNextMonth}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
