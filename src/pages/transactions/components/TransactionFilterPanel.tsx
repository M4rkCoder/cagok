import { useMemo, useState } from "react";
import {
  Search,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  X,
  Filter,
  RotateCcw,
  ArrowRight,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  Calendar1Icon,
  Shapes,
  FilterIcon,
  LayoutGrid,
} from "lucide-react";
import { format, startOfMonth, subMonths, subYears } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { useAppStore } from "@/store/useAppStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DateRange } from "react-day-picker";
import { TransactionFilters } from "@/types";
import {
  ExpenseBadge,
  FixedExpenseBadge,
  IncomeBadge,
  VariableExpenseBadge,
} from "../TransactionBadge";
import { CategoryIcon } from "@/components/CategoryIcon";

type TransactionMode =
  | "all"
  | "income"
  | "total_expense"
  | "fixed_expense"
  | "variable_expense";

interface FilterState {
  keyword: string;
  categoryIds: number[];
  dateRange: DateRange | undefined;
  minAmount: string;
  maxAmount: string;
  mode: TransactionMode;
}

const DEFAULT_FILTERS: FilterState = {
  keyword: "",
  categoryIds: [],
  dateRange: undefined,
  minAmount: "",
  maxAmount: "",
  mode: "all",
};

const MODE_CONFIG = {
  all: { label: "전체", badge: "구분" },
  income: { label: "수입", badge: <IncomeBadge /> },
  total_expense: { label: "총지출", badge: <ExpenseBadge /> },
  fixed_expense: { label: "고정지출", badge: <FixedExpenseBadge /> },
  variable_expense: { label: "변동지출", badge: <VariableExpenseBadge /> },
} as const;

export function TransactionFilterPanel() {
  const { categories } = useAppStore();
  const { setFilters: setStoreFilters, fetchFilteredAll } =
    useTransactionStore();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openCategory, setOpenCategory] = useState(false);
  const [openMode, setOpenMode] = useState(false);
  const [tempAmount, setTempAmount] = useState({ min: "", max: "" });
  const [openPrice, setOpenPrice] = useState(false);
  const current = MODE_CONFIG[filters.mode];

  const applyPriceFilter = async () => {
    setFilters((prev) => ({
      ...prev,
      minAmount: tempAmount.min,
      maxAmount: tempAmount.max,
    }));

    // 2. 팝오버 닫기
    setOpenPrice(false);

    const backendFilters = constructBackendFilters();
    const finalFilters = {
      ...backendFilters,
      min_amount: tempAmount.min ? Number(tempAmount.min) : undefined,
      max_amount: tempAmount.max ? Number(tempAmount.max) : undefined,
    };

    setStoreFilters(finalFilters);
    await fetchFilteredAll(finalFilters);
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredCategories = useMemo(() => {
    if (filters.mode === "all") return categories;
    const targetType = filters.mode === "income" ? 0 : 1;
    return categories.filter((c) => c.type === targetType);
  }, [categories, filters.mode]);

  const updateMode = (mode: TransactionMode) => {
    setFilters((prev) => {
      const targetType = mode === "income" ? 0 : 1;
      const nextCategoryIds =
        mode === "all"
          ? prev.categoryIds
          : prev.categoryIds.filter(
              (id) => categories.find((c) => c.id === id)?.type === targetType
            );

      return { ...prev, mode, categoryIds: nextCategoryIds };
    });
  };

  const constructBackendFilters = (): TransactionFilters => {
    return {
      keyword: filters.keyword || undefined,
      tx_type:
        filters.mode === "all" ? undefined : filters.mode === "income" ? 0 : 1,
      is_fixed:
        filters.mode === "fixed_expense"
          ? true
          : filters.mode === "variable_expense"
            ? false
            : undefined,
      category_ids:
        filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      start_date: filters.dateRange?.from
        ? format(filters.dateRange.from, "yyyy-MM-dd")
        : undefined,
      end_date: filters.dateRange?.to
        ? format(filters.dateRange.to, "yyyy-MM-dd")
        : undefined,
      min_amount: filters.minAmount ? Number(filters.minAmount) : undefined,
      max_amount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
    };
  };

  const handleApply = async () => {
    const backendFilters = constructBackendFilters();
    setStoreFilters(backendFilters);
    await fetchFilteredAll(backendFilters);
  };

  const handleReset = async () => {
    setFilters(DEFAULT_FILTERS);
    setStoreFilters({});
    await fetchFilteredAll({});
  };

  const selectedCategories = categories.filter((c) =>
    filters.categoryIds.includes(c.id)
  );

  return (
    <Card className="p-2 border-slate-200/60 bg-background backdrop-blur shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-3">
        {/* 검색어 */}
        <div className="flex items-center min-w-[150px] flex-1 max-w-[250px]">
          <div className="relative flex-1 group">
            {/* 왼쪽 검색 아이콘 */}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />

            <Input
              value={filters.keyword}
              onChange={(e) => updateFilter("keyword", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="내역/메모 검색..."
              className="pl-8 h-8 text-xs bg-white/50 border-slate-200 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0 transition-all"
            />
          </div>

          {/* 오른쪽 끝 검색 버튼 */}
          <Button
            type="button"
            variant="secondary" // 혹은 'outline'
            onClick={handleApply}
            className="h-8 px-3 text-xs rounded-l-none border border-l-0 border-slate-200 bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white font-semibold transition-colors"
          >
            검색
          </Button>
        </div>

        {/* 거래 유형 (Select) */}
        <Popover open={openMode} onOpenChange={setOpenMode}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
                filters.mode !== "all" && "border-slate-800 bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3 text-slate-400" />
                <span>{current.label}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[130px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {Object.entries(MODE_CONFIG).map(([key, config]) => (
                    <CommandItem
                      key={key}
                      onSelect={() => {
                        setFilters((prev: any) => ({ ...prev, mode: key }));
                        setOpenMode(false);
                      }}
                      className="text-xs py-1.5"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
                          filters.mode === key ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {config.badge}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 카테고리 (팝오버) */}
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
                selectedCategories.length > 0 && "border-slate-800 bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Shapes className="h-3 w-3 text-slate-400" />
                <span>
                  {filters.categoryIds.length > 0
                    ? `${filters.categoryIds.length}개`
                    : "카테고리"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="카테고리 검색..."
                className="h-8 text-xs"
              />
              <CommandList>
                <CommandEmpty className="text-[11px] py-2">
                  결과 없음
                </CommandEmpty>
                <CommandGroup>
                  {filteredCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => {
                        const next = filters.categoryIds.includes(category.id)
                          ? filters.categoryIds.filter(
                              (id) => id !== category.id
                            )
                          : [...filters.categoryIds, category.id];
                        updateFilter("categoryIds", next);
                      }}
                      className="text-sm py-1.5"
                    >
                      <Check
                        className={cn(
                          "mr-0 h-3 w-3",
                          filters.categoryIds.includes(category.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <CategoryIcon
                        icon={category.icon}
                        type={category.type}
                        size="xs"
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 날짜 범위 (팝오버) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
                filters.dateRange && "border-slate-800 bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3 text-slate-400" />
                <span>
                  {filters.dateRange?.from
                    ? filters.dateRange.to
                      ? `${format(filters.dateRange.from, "MM.dd")}~${format(filters.dateRange.to, "MM.dd")}`
                      : format(filters.dateRange.from, "MM.dd")
                    : "기간"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 border-b grid grid-cols-4 gap-1 bg-slate-50/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const start = startOfMonth(new Date());
                  updateFilter("dateRange", { from: start, to: new Date() });
                }}
                className="text-sm h-7"
              >
                이번 달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const start = subMonths(new Date(), 3);
                  updateFilter("dateRange", { from: start, to: new Date() });
                }}
                className="text-sm h-7"
              >
                3개월
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const start = subMonths(new Date(), 6);
                  updateFilter("dateRange", { from: start, to: new Date() });
                }}
                className="text-sm h-7"
              >
                6개월
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const start = subYears(new Date(), 1);
                  updateFilter("dateRange", { from: start, to: new Date() });
                }}
                className="text-sm h-7"
              >
                1년
              </Button>
            </div>
            <Calendar
              initialFocus
              mode="range"
              selected={filters.dateRange}
              onSelect={(range) => updateFilter("dateRange", range)}
              numberOfMonths={2}
              locale={ko}
              className="text-xs"
            />
          </PopoverContent>
        </Popover>

        {/* 금액 (팝오버) */}
        <Popover open={openPrice} onOpenChange={setOpenPrice}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
                (filters.minAmount || filters.maxAmount) &&
                  "border-slate-800 bg-slate-50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3 w-3 text-slate-400" />
                <span
                  className={cn(
                    (filters.minAmount || filters.maxAmount) &&
                      "text-slate-900 font-bold"
                  )}
                >
                  {filters.minAmount || filters.maxAmount
                    ? "금액 필터"
                    : "금액"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4" align="start">
            <div className="space-y-4">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                금액 범위 (원)
              </Label>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={tempAmount.min}
                  onChange={(e) =>
                    setTempAmount((prev) => ({ ...prev, min: e.target.value }))
                  }
                  className="h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                />
                <span className="text-slate-300">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={tempAmount.max}
                  onChange={(e) =>
                    setTempAmount((prev) => ({ ...prev, max: e.target.value }))
                  }
                  className="h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="h-8 flex-1 text-xs text-slate-500"
                  onClick={() => {
                    setTempAmount({ min: "", max: "" });
                    updateFilter("minAmount", "");
                    updateFilter("maxAmount", "");
                  }}
                >
                  초기화
                </Button>
                <Button
                  className="h-8 flex-1 text-xs bg-slate-800 hover:bg-slate-900"
                  onClick={applyPriceFilter} // 팝오버 내에서 즉시 적용 버튼
                >
                  확인
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 액션 버튼 그룹 */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            onClick={handleApply}
            size="sm"
            className="h-8 px-4 text-xs font-bold bg-slate-800 hover:bg-slate-900 shadow-sm rounded-full"
          >
            <FilterIcon />
            적용
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 선택된 필터 칩 (공간이 있을 때만 표시) */}
      {(selectedCategories.length > 0 || filters) && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
          {filters.keyword && (
            <Badge
              key={filters.keyword}
              variant="secondary"
              className="text-sm h-5 gap-1 bg-slate-100/80 text-slate-600 border-none px-1.5"
            >
              <Search className="h-3 w-3" />
              {filters.keyword}
              <X
                className="h-2.5 w-2.5 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  updateFilter("keyword", "");
                }}
              />
            </Badge>
          )}
          {filters.mode !== "all" && (
            <Badge
              key={filters.mode}
              variant="outline"
              className="text-sm h-5 gap-1 border-none px-1.5 scale-110"
            >
              {MODE_CONFIG[filters.mode].badge}
              <X
                className="h-2.5 w-2.5 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  updateFilter("mode", "all");
                }}
              />
            </Badge>
          )}
          {selectedCategories.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="text-sm h-5 gap-1 bg-slate-100/80 text-slate-600 border-none px-1.5"
            >
              <span className="native-emoji">{c.icon}</span>
              {c.name}
              <X
                className="h-2.5 w-2.5 cursor-pointer hover:text-slate-900"
                onClick={() => {
                  const next = filters.categoryIds.filter((id) => id !== c.id);
                  updateFilter("categoryIds", next);
                }}
              />
            </Badge>
          ))}
          {filters.dateRange?.from && (
            <Badge
              variant="secondary"
              className="text-sm h-5 gap-1 bg-slate-100 text-slate-700 border-slate-200 px-1.5 font-medium"
            >
              <CalendarIcon className="h-3 w-3" />
              {format(filters.dateRange.from, "yyyy.M.d")}
              {filters.dateRange.to &&
                ` ~ ${format(filters.dateRange.to, "yyyy.M.d")}`}
              <X
                className="h-2.5 w-2.5 cursor-pointer hover:text-blue-900"
                onClick={() => updateFilter("dateRange", undefined)}
              />
            </Badge>
          )}
          {(filters.minAmount || filters.maxAmount) && (
            <Badge
              variant="secondary"
              className="text-sm h-5 gap-1 bg-slate-100 text-slate-700 border-slate-200 px-1.5 font-medium"
            >
              <Wallet className="h-3 w-3 text-slate-400" />
              <span>
                {filters.minAmount
                  ? Number(filters.minAmount).toLocaleString()
                  : "0"}
                ~
                {filters.maxAmount
                  ? Number(filters.maxAmount).toLocaleString()
                  : "무제한"}
              </span>
              <X
                className="h-3 w-3 cursor-pointer ml-1 hover:text-red-500 transition-colors"
                onClick={() => {
                  updateFilter("minAmount", "");
                  updateFilter("maxAmount", "");
                  setTempAmount({ min: "", max: "" });
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
