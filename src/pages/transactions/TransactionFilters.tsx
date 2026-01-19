import React, { useState } from "react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Category } from "@/types";
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
} from "./TransactionBadge";

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
  categories: Category[];
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
  categories,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false); // 카테고리 팝오버 상태

  // 현재 필터가 하나라도 적용되어 있는지 확인
  const isFiltered =
    searchQuery !== "" ||
    filterType !== null ||
    filterCategory !== null ||
    startDate !== undefined ||
    endDate !== undefined;

  // 모든 필터 초기화 함수
  const handleReset = () => {
    setSearchQuery("");
    setSearchTriggerQuery("");
    setFilterType(null);
    setFilterCategory(null);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // 현재 선택된 카테고리 객체 찾기
  const selectedCategory = categories.find(
    (cat) => cat.id?.toString() === filterCategory
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
        <SelectTrigger className="w-45">
          <SelectValue placeholder={t("filter_by_type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all_types")}</SelectItem>
          <SelectItem value="0">
            <IncomeBadge /> {t("income")}
          </SelectItem>
          <SelectItem value="1">
            <ExpenseBadge /> {t("expense")}
          </SelectItem>
          <SelectItem value="fixed_expense">
            <FixedExpenseBadge /> {t("fixed_expense")}
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
            className="w-45 justify-between"
          >
            <span className="truncate">
              {filterCategory === null
                ? t("all_categories")
                : `${selectedCategory?.icon} ${selectedCategory?.name}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-45 p-0">
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

      {/* 4. 시작 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-45 justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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

      {/* 5. 종료 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-45 justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={handleReset}
          className="h-8 px-2 lg:px-3"
        >
          <RotateCcw className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TransactionFilters;
