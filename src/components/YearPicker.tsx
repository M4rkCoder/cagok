import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYear } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useTranslation } from "react-i18next";

interface YearPickerProps {
  selectedYear: number;
  onYearChange: (newYear: number) => void;
}

export const YearPicker: React.FC<YearPickerProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const { t } = useTranslation();
  const { formatYear } = useDateFormatter();

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year, 10);
    onYearChange(newYear); // Update external state
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
      <Select
        value={selectedYear.toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="w-[100px] justify-center text-center font-semibold">
          <SelectValue placeholder={t("common.year")} />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {formatYear(year)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={handleNextYear}>
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
