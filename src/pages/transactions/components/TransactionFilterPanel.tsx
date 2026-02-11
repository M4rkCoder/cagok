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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useAppStore } from "@/store/useAppStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DateRange } from "react-day-picker";
import { TransactionFilters } from "@/types";

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

interface Props {
  onClose?: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  keyword: "",
  categoryIds: [],
  dateRange: undefined,
  minAmount: "",
  maxAmount: "",
  mode: "all",
};

export function TransactionFilterPanel({ onClose }: Props) {
  const { categories } = useAppStore();
  const { setFilters: setStoreFilters, fetchFilteredAll } =
    useTransactionStore();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openCategory, setOpenCategory] = useState(false);

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
              (id) => categories.find((c) => c.id === id)?.type === targetType,
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
    filters.categoryIds.includes(c.id),
  );

  return (
    <Card className="p-2 border-slate-200/60 bg-white/70 backdrop-blur shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2">
        {/* 검색어 */}
        <div className="relative min-w-[140px] flex-1 max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="내역/메모 검색..."
            className="pl-8 h-8 text-xs bg-white/50 border-slate-200"
          />
        </div>

        {/* 거래 유형 (Select) */}
        <Select
          value={filters.mode}
          onValueChange={(v) => updateMode(v as TransactionMode)}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs bg-white/50 border-slate-200">
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="income">💰 수입</SelectItem>
            <SelectItem value="total_expense">💸 총지출</SelectItem>
            <SelectItem value="fixed_expense">📌 고정지출</SelectItem>
            <SelectItem value="variable_expense">🌊 변동지출</SelectItem>
          </SelectContent>
        </Select>

        {/* 카테고리 (팝오버) */}
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-slate-200 bg-white/50"
            >
              <Filter className="h-3 w-3 text-slate-400" />
              <span>
                {filters.categoryIds.length > 0
                  ? `${filters.categoryIds.length}개`
                  : "카테고리"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
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
                          ? filters.categoryIds.filter((id) => id !== category.id)
                          : [...filters.categoryIds, category.id];
                        updateFilter("categoryIds", next);
                      }}
                      className="text-xs py-1.5"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
                          filters.categoryIds.includes(category.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="mr-1.5">{category.icon}</span>{" "}
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
              className="h-8 text-xs gap-1.5 border-slate-200 bg-white/50"
            >
              <CalendarIcon className="h-3 w-3 text-slate-400" />
              <span>
                {filters.dateRange?.from
                  ? filters.dateRange.to
                    ? `${format(filters.dateRange.from, "MM.dd")}~${format(filters.dateRange.to, "MM.dd")}`
                    : format(filters.dateRange.from, "MM.dd")
                  : "기간"}
              </span>
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
                className="text-[10px] h-7"
              >
                이번달
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const start = subMonths(new Date(), 3);
                  updateFilter("dateRange", { from: start, to: new Date() });
                }}
                className="text-[10px] h-7"
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
                className="text-[10px] h-7"
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
                className="text-[10px] h-7"
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-slate-200 bg-white/50"
            >
              <Wallet className="h-3 w-3 text-slate-400" />
              <span>
                {filters.minAmount || filters.maxAmount ? "금액필터" : "금액"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="start">
            <div className="space-y-3">
              <Label className="text-[11px] font-bold text-slate-400 uppercase">
                금액 범위
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-slate-400">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", e.target.value)}
                  className="h-8 text-xs"
                />
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
          {onClose && (
            <>
              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 선택된 필터 칩 (공간이 있을 때만 표시) */}
      {(selectedCategories.length > 0 || filters.dateRange?.from) && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
          {selectedCategories.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="text-[9px] h-5 gap-1 bg-slate-100/80 text-slate-600 border-none px-1.5"
            >
              {c.icon} {c.name}
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
              className="text-[9px] h-5 gap-1 bg-blue-50 text-blue-600 border-none px-1.5"
            >
              {format(filters.dateRange.from, "yy.MM.dd")}
              {filters.dateRange.to &&
                ` ~ ${format(filters.dateRange.to, "yy.MM.dd")}`}
              <X
                className="h-2.5 w-2.5 cursor-pointer hover:text-blue-900"
                onClick={() => updateFilter("dateRange", undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}