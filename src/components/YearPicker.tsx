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
  setYear,
  setDefaultOptions,
  addYears,
  subYears,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

setDefaultOptions({ locale: ko });

interface YearPickerProps {
  selectedYear: number;
  onYearChange: (newYear: number) => void;
}

export const YearPicker: React.FC<YearPickerProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date()); // Internal state for the picker

  useEffect(() => {
    setPickerDate(setYear(new Date(), selectedYear));
  }, [selectedYear]);

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year, 10);
    onYearChange(newYear); // Update external state
    setPickerDate(setYear(pickerDate, newYear));
    setPopoverOpen(false); // Close popover after year selection
  };

  const handlePreviousYear = () => {
    const newYear = selectedYear - 1;
    onYearChange(newYear);
  };

  const handleNextYear = () => {
    const newYear = selectedYear + 1;
    onYearChange(newYear);
  };

  // Generate years for the select dropdown: current year +/- 5 years
  const currentFullYear = getYear(new Date());
  const years = Array.from(
    { length: 11 },
    (_, i) => currentFullYear - 5 + i
  );

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePreviousYear}>
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-[100px] justify-center text-center font-semibold"
          >
            {selectedYear ? `${selectedYear}년` : <span>연도 선택</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex flex-col space-y-2">
            {/* Year Selection */}
            <div className="flex items-center justify-center gap-1">
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[100px]">
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
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={handleNextYear}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
