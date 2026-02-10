import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  RotateCcw,
} from "lucide-react";
import {
  IncomeBadge,
  ExpenseBadge,
  FixedExpenseBadge,
} from "../TransactionBadge";
import { useAppStore } from "@/store/useAppStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSearchTriggerQuery: (query: string) => void;
  filterType: string | null;
  setFilterType: (type: string | null) => void;
  filterCategory: string | null;
  setFilterCategory: (categoryId: string | null) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  setSearchTriggerQuery,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const { t } = useTranslation();
  const { categories, fetchCategories } = useAppStore();
  const [open, setOpen] = useState(false); // 카테고리 팝오버 상태
  const [preset, setPreset] = useState<string>("");

  // 현재 필터가 하나라도 적용되어 있는지 확인
  const isFiltered =
    searchQuery !== "" ||
    filterType !== null ||
    filterCategory !== null ||
    startDate !== undefined ||
    endDate !== undefined;

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  // 모든 필터 초기화 함수
  const handleReset = () => {
    setSearchQuery("");
    setSearchTriggerQuery("");
    setFilterType(null);
    setFilterCategory(null);
    setStartDate(undefined);
    setEndDate(undefined);
    setPreset("");
  };

  // 현재 선택된 카테고리 객체 찾기
  const selectedCategory = categories.find(
    (cat) => String(cat.id) === String(filterCategory)
  );

  const handleTypeChange = (value: string) => {
    if (value === "all") {
      setFilterType(null);
    } else if (value === "fixed_expense") {
      setFilterType("fixed_expense");
    } else {
      setFilterType(value); // 0: income 1: expense
    }
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);

    if (value === "all") {
      setStartDate(undefined);
      setEndDate(undefined);
      return;
    }
    const now = new Date();
    const end = endOfDay(now);
    let start: Date;

    switch (value) {
      case "1m":
        start = startOfDay(subMonths(now, 1));
        break;
      case "3m":
        start = startOfDay(subMonths(now, 3));
        break;
      case "6m":
        start = startOfDay(subMonths(now, 6));
        break;
      case "1y":
        start = startOfDay(subYears(now, 1));
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    if (preset !== "" && preset !== "all") {
      setPreset("");
    }
  }, [startDate, endDate]);

  return (
    <div className="flex items-center space-x-4">
      {/* 1. 검색창 */}
      <div className="relative flex-1">
        <Input
          placeholder={t("search_transactions")}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setSearchTriggerQuery(searchQuery);
            }
          }}
          className="pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2"
          onClick={() => setSearchTriggerQuery(searchQuery)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {/* 2. 유형 필터 (수입/지출) */}
      <Select value={filterType || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-30">
          <SelectValue placeholder={t("filter_by_type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all_types")}</SelectItem>
          <SelectItem value="0">
            <IncomeBadge />
          </SelectItem>
          <SelectItem value="1">
            <ExpenseBadge />
          </SelectItem>
          <SelectItem value="fixed_expense">
            <FixedExpenseBadge />
          </SelectItem>
        </SelectContent>
      </Select>
      {/* 3. 분류 필터 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-30 justify-between"
          >
            <span className="truncate">
              {filterCategory === null
                ? t("all_categories")
                : `${selectedCategory?.icon} ${selectedCategory?.name}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0">
          <Command>
            <CommandInput placeholder={t("search_category")} />
            <CommandList>
              <CommandEmpty>{t("no_results_found")}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setFilterCategory(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterCategory === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {t("all_categories")}
                </CommandItem>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name} // 검색 시 이름으로 찾기 위해 설정
                    onSelect={() => {
                      setFilterCategory(category.id!.toString());
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filterCategory === category.id?.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {category.icon} {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 4. 분류 필터 뒤 혹은 날짜 필터 앞에 추가 */}
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder={t("period_preset")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-muted-foreground font-medium">
            {t("all_time")}
          </SelectItem>
          <SelectItem value="1m">{t("1_month")}</SelectItem>
          <SelectItem value="3m">{t("3_months")}</SelectItem>
          <SelectItem value="6m">{t("6_months")}</SelectItem>
          <SelectItem value="1y">{t("1_year")}</SelectItem>
        </SelectContent>
      </Select>
      {/* 5. 시작 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-30 justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {startDate ? (
              format(startDate, "yyyy/MM/dd")
            ) : (
              <span>{t("pick_start_date")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <span>-</span>
      {/* 6. 종료 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-30 justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {endDate ? (
              format(endDate, "yyyy/MM/dd")
            ) : (
              <span>{t("pick_end_date")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
        </PopoverContent>
      </Popover>
      {/* 필터 초기화 버튼 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleReset}
            className="px-1 lg:px-3"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>필터 초기화</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default TransactionFilters;
