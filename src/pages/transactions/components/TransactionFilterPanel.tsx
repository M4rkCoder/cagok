import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Check,
  X,
  RotateCcw,
  Wallet,
  ChevronDown,
  Shapes,
  LayoutGrid,
  CalendarIcon,
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
import { useAppStore } from "@/stores/useAppStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { DateRange } from "react-day-picker";
import { TransactionFilters } from "@/types";
import {
  ExpenseBadge,
  FixedExpenseBadge,
  IncomeBadge,
  VariableExpenseBadge,
} from "../TransactionBadge";
import { CategoryIcon } from "@/components/CategoryIcon";

import { useTranslation } from "react-i18next";

type TransactionMode =
  | "all"
  | "income"
  | "total_expense"
  | "fixed_expense"
  | "variable_expense";

export interface FilterState {
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

// ============================================================================
// [Main Component]
// ============================================================================
export function TransactionFilterPanel() {
  const { t } = useTranslation();
  const { categoryList } = useAppStore();

  const MODE_CONFIG = {
    all: { label: t("transaction_filter.modes.all"), badge: t("transaction_filter.modes.divider") },
    income: { label: t("transaction_filter.modes.income"), badge: <IncomeBadge /> },
    total_expense: { label: t("transaction_filter.modes.total_expense"), badge: <ExpenseBadge /> },
    fixed_expense: { label: t("transaction_filter.modes.fixed_expense"), badge: <FixedExpenseBadge /> },
    variable_expense: { label: t("transaction_filter.modes.variable_expense"), badge: <VariableExpenseBadge /> },
  } as const;
  const {
    filters: storeFilters,
    setFilters: setStoreFilters,
    fetchFilteredAll,
  } = useTransactionStore();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [localKeyword, setLocalKeyword] = useState(filters.keyword);

  // 스토어 상태 -> 로컬 상태 동기화
  useEffect(() => {
    if (storeFilters) {
      const restoredFilters: FilterState = {
        keyword: storeFilters.keyword || "",
        categoryIds: storeFilters.category_ids || [],
        dateRange: storeFilters.start_date
          ? {
              from: new Date(storeFilters.start_date),
              to: storeFilters.end_date
                ? new Date(storeFilters.end_date)
                : undefined,
            }
          : undefined,
        minAmount: storeFilters.min_amount?.toString() || "",
        maxAmount: storeFilters.max_amount?.toString() || "",
        mode:
          storeFilters.tx_type === 0
            ? "income"
            : storeFilters.is_fixed === true
              ? "fixed_expense"
              : storeFilters.is_fixed === false
                ? "variable_expense"
                : storeFilters.tx_type === 1
                  ? "total_expense"
                  : "all",
      };

      setFilters(restoredFilters);
      setLocalKeyword(restoredFilters.keyword);
    }
  }, [storeFilters]);

  // 백엔드 파라미터 규격으로 변환
  const constructBackendFilters = (
    fs: FilterState = filters
  ): TransactionFilters => {
    return {
      keyword: fs.keyword || undefined,
      tx_type: fs.mode === "all" ? undefined : fs.mode === "income" ? 0 : 1,
      is_fixed:
        fs.mode === "fixed_expense"
          ? true
          : fs.mode === "variable_expense"
            ? false
            : undefined,
      category_ids: fs.categoryIds.length > 0 ? fs.categoryIds : undefined,
      start_date: fs.dateRange?.from
        ? format(fs.dateRange.from, "yyyy-MM-dd")
        : undefined,
      end_date: fs.dateRange?.to
        ? format(fs.dateRange.to, "yyyy-MM-dd")
        : undefined,
      min_amount: fs.minAmount ? Number(fs.minAmount) : undefined,
      max_amount: fs.maxAmount ? Number(fs.maxAmount) : undefined,
    };
  };

  // ✅ 핵심: 상태 업데이트와 동시에 검색을 즉시 실행하는 통합 함수
  const applyFilters = async (nextFilters: FilterState) => {
    setFilters(nextFilters);
    const backendFilters = constructBackendFilters(nextFilters);
    setStoreFilters(backendFilters);
    await fetchFilteredAll(backendFilters);
  };

  // 단일 필터 변경 시 호출
  const updateFilter = (key: keyof FilterState, value: any) => {
    applyFilters({ ...filters, [key]: value });
  };

  // 가격 필터 변경 시 호출
  const applyPriceFilter = (min: string, max: string) => {
    applyFilters({ ...filters, minAmount: min, maxAmount: max });
  };

  // 검색어 입력 후 엔터/검색버튼 클릭 시 호출
  const handleSearch = () => {
    applyFilters({ ...filters, keyword: localKeyword });
  };

  // 전체 초기화
  const handleReset = async () => {
    setFilters(DEFAULT_FILTERS);
    setLocalKeyword("");
    setStoreFilters({});
    await fetchFilteredAll({});
  };

  // 선택된 모드에 맞춰 카테고리 목록 필터링
  const filteredCategories = useMemo(() => {
    if (filters.mode === "all") return categoryList;
    const targetType = filters.mode === "income" ? 0 : 1;
    return categoryList.filter((c) => c.type === targetType);
  }, [categoryList, filters.mode]);

  const selectedCategories = categoryList.filter((c) =>
    filters.categoryIds.includes(c.id)
  );

  return (
    <Card className="p-2 border-slate-200/60 bg-background backdrop-blur shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchFilter
          keyword={localKeyword}
          setKeyword={setLocalKeyword}
          onSearch={handleSearch}
        />
        <ModeSelector
          mode={filters.mode}
          onModeChange={(m) => updateFilter("mode", m)}
          MODE_CONFIG={MODE_CONFIG}
        />
        <CategorySelector
          selectedIds={filters.categoryIds}
          categories={filteredCategories}
          onToggle={(ids) => updateFilter("categoryIds", ids)}
        />
        <DateRangeSelector
          dateRange={filters.dateRange}
          onDateChange={(range) => updateFilter("dateRange", range)}
        />
        <PriceSelector
          minAmount={filters.minAmount}
          maxAmount={filters.maxAmount}
          onApply={applyPriceFilter}
          onReset={() => applyPriceFilter("", "")}
        />

        {/* 액션 버튼 그룹: 전체 적용 버튼 제거, 초기화(리셋) 버튼만 유지 */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title={t("transaction_filter.reset_filter")}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SelectedFilterBadges
        filters={filters}
        selectedCategories={selectedCategories}
        updateFilter={updateFilter}
        setLocalKeyword={setLocalKeyword}
        clearPriceFilter={() => applyPriceFilter("", "")}
        MODE_CONFIG={MODE_CONFIG}
      />
    </Card>
  );
}

// ============================================================================
// [Sub Components]
// ============================================================================

// 1. 검색창 컴포넌트
function SearchFilter({
  keyword,
  setKeyword,
  onSearch,
}: {
  keyword: string;
  setKeyword: (val: string) => void;
  onSearch: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center min-w-[150px] flex-1 max-w-[250px]">
      <div className="relative flex-1 group">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={t("transaction_filter.search_placeholder")}
          className="pl-8 h-8 text-xs bg-white/50 border-slate-200 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0 transition-all"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={onSearch}
        className="h-8 px-3 text-xs rounded-l-none border border-l-0 border-slate-200 bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white font-semibold transition-colors"
      >
        {t("transaction_filter.search_button")}
      </Button>
    </div>
  );
}

// 2. 거래 유형 선택 컴포넌트
function ModeSelector({
  mode,
  onModeChange,
  MODE_CONFIG,
}: {
  mode: TransactionMode;
  onModeChange: (m: TransactionMode) => void;
  MODE_CONFIG: any;
}) {
  const [open, setOpen] = useState(false);
  const current = MODE_CONFIG[mode];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
            mode !== "all" && "border-slate-800 bg-slate-50"
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
              {(Object.keys(MODE_CONFIG) as TransactionMode[]).map((key) => (
                <CommandItem
                  key={key}
                  onSelect={() => {
                    onModeChange(key);
                    setOpen(false); // 항목 선택 시 팝오버 닫기 & 즉시 반영
                  }}
                  className="text-xs py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      mode === key ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {MODE_CONFIG[key].badge}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// 3. 카테고리 선택 컴포넌트
function CategorySelector({
  selectedIds,
  categories,
  onToggle,
}: {
  selectedIds: number[];
  categories: any[];
  onToggle: (ids: number[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
            selectedIds.length > 0 && "border-slate-800 bg-slate-50"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Shapes className="h-3 w-3 text-slate-400" />
            <span>
              {selectedIds.length > 0 ? t("common.count", { count: selectedIds.length, defaultValue: `${selectedIds.length}개` }) : t("transaction_filter.category")}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("transaction_form.search_category")}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-[11px] py-2">{t("transaction_form.no_results")}</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => {
                    const next = selectedIds.includes(category.id)
                      ? selectedIds.filter((id) => id !== category.id)
                      : [...selectedIds, category.id];
                    onToggle(next); // 체크하는 즉시 필터 반영
                  }}
                  className="text-sm py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-0 h-3 w-3",
                      selectedIds.includes(category.id)
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
  );
}

// 4. 날짜 범위 선택 컴포넌트
function DateRangeSelector({
  dateRange,
  onDateChange,
}: {
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
            dateRange && "border-slate-800 bg-slate-50"
          )}
        >
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3 w-3 text-slate-400" />
            <span>
              {dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "MM.dd")}~${format(dateRange.to, "MM.dd")}`
                  : format(dateRange.from, "MM.dd")
                : t("transaction_filter.period")}
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
            onClick={() =>
              onDateChange({ from: startOfMonth(new Date()), to: new Date() })
            }
            className="text-sm h-7"
          >
            {t("transaction_filter.this_month")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onDateChange({ from: subMonths(new Date(), 3), to: new Date() })
            }
            className="text-sm h-7"
          >
            {t("transaction_filter.3_months")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onDateChange({ from: subMonths(new Date(), 6), to: new Date() })
            }
            className="text-sm h-7"
          >
            {t("transaction_filter.6_months")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onDateChange({ from: subYears(new Date(), 1), to: new Date() })
            }
            className="text-sm h-7"
          >
            {t("transaction_filter.1_year")}
          </Button>
        </div>
        <Calendar
          initialFocus
          mode="range"
          selected={dateRange}
          onSelect={onDateChange} // 날짜 클릭 즉시 반영
          numberOfMonths={2}
          locale={i18n.language === "ko" ? ko : undefined}
          className="text-xs"
        />
      </PopoverContent>
    </Popover>
  );
}

// 5. 금액 범위 선택 컴포넌트
function PriceSelector({
  minAmount,
  maxAmount,
  onApply,
  onReset,
}: {
  minAmount: string;
  maxAmount: string;
  onApply: (min: string, max: string) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tempAmount, setTempAmount] = useState({
    min: minAmount,
    max: maxAmount,
  });

  useEffect(() => {
    setTempAmount({ min: minAmount, max: maxAmount });
  }, [minAmount, maxAmount, open]);

  const handleApply = () => {
    onApply(tempAmount.min, tempAmount.max);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 text-xs gap-1.5 border-slate-200 bg-white/50 min-w-[110px] justify-between",
            (minAmount || maxAmount) && "border-slate-800 bg-slate-50"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3 w-3 text-slate-400" />
            <span
              className={cn(
                (minAmount || maxAmount) && "text-slate-900 font-bold"
              )}
            >
              {minAmount || maxAmount ? t("transaction_filter.amount_filter") : t("transaction_filter.amount")}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4" align="start">
        <div className="space-y-4">
          <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
            {t("transaction_filter.amount_range")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t("transaction_filter.min")}
              value={tempAmount.min}
              onChange={(e) =>
                setTempAmount((prev) => ({ ...prev, min: e.target.value }))
              }
              className="h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
            <span className="text-slate-300">~</span>
            <Input
              type="number"
              placeholder={t("transaction_filter.max")}
              value={tempAmount.max}
              onChange={(e) =>
                setTempAmount((prev) => ({ ...prev, max: e.target.value }))
              }
              className="h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="h-8 flex-1 text-xs text-slate-500"
              onClick={() => {
                setTempAmount({ min: "", max: "" });
                onReset();
                setOpen(false); // 즉시 닫고 리셋
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="h-8 flex-1 text-xs bg-slate-800 hover:bg-slate-900"
              onClick={handleApply}
            >
              {t("transaction_filter.confirm")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 6. 활성화된 필터 뱃지(칩) 모음 컴포넌트
function SelectedFilterBadges({
  filters,
  selectedCategories,
  updateFilter,
  setLocalKeyword,
  clearPriceFilter,
  MODE_CONFIG,
}: {
  filters: FilterState;
  selectedCategories: any[];
  updateFilter: (key: keyof FilterState, value: any) => void;
  setLocalKeyword: (val: string) => void;
  clearPriceFilter: () => void;
  MODE_CONFIG: any;
}) {
  const { t } = useTranslation();
  const hasActiveFilters =
    filters.keyword ||
    filters.mode !== "all" ||
    selectedCategories.length > 0 ||
    filters.dateRange?.from ||
    filters.minAmount ||
    filters.maxAmount;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
      {filters.keyword && (
        <Badge
          variant="secondary"
          className="text-sm h-5 gap-1 bg-slate-100/80 text-slate-600 border-none px-1.5"
        >
          <Search className="h-3 w-3" />
          {filters.keyword}
          <X
            className="h-2.5 w-2.5 cursor-pointer hover:text-slate-900"
            onClick={() => {
              updateFilter("keyword", ""); // 삭제 시 즉시 검색 반영
              setLocalKeyword("");
            }}
          />
        </Badge>
      )}

      {filters.mode !== "all" && (
        <Badge
          variant="outline"
          className="text-sm h-5 gap-1 border-none px-1.5 scale-110"
        >
          {MODE_CONFIG[filters.mode].badge}
          <X
            className="h-2.5 w-2.5 cursor-pointer hover:text-slate-900"
            onClick={() => updateFilter("mode", "all")} // 삭제 시 즉시 검색 반영
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
              updateFilter("categoryIds", next); // 삭제 시 즉시 검색 반영
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
            onClick={() => updateFilter("dateRange", undefined)} // 삭제 시 즉시 검색 반영
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
              : t("transaction_filter.unlimited")}
          </span>
          <X
            className="h-3 w-3 cursor-pointer ml-1 hover:text-red-500 transition-colors"
            onClick={clearPriceFilter}
          />
        </Badge>
      )}
    </div>
  );
}

