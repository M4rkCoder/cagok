import { useState } from "react";
import {
  Search,
  ChevronRight,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  X,
} from "lucide-react";
import { format, startOfMonth, subMonths, subYears } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { DateRange } from "react-day-picker";

export interface FilterState {
  keyword: string;
  categoryIds: number[];
  dateRange: DateRange | undefined;
  minAmount: string;
  maxAmount: string;
}

interface Props {
  onClose: () => void;
  onApplyFilter?: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

const DEFAULT_FILTERS: FilterState = {
  keyword: "",
  categoryIds: [],
  dateRange: undefined,
  minAmount: "",
  maxAmount: "",
};

export function TransactionFilterPanel({
  onClose,
  onApplyFilter,
  initialFilters,
}: Props) {
  const { categories } = useAppStore();
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));
  const [openCategory, setOpenCategory] = useState(false);

  // 입력값 변경 핸들러 (단순 상태 업데이트)
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 카테고리 토글
  const toggleCategory = (id: number) => {
    const current = filters.categoryIds;
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    updateFilter("categoryIds", next);
  };

  const selectDatePreset = (months: number) => {
    const end = new Date();
    const start =
      months === 0
        ? startOfMonth(new Date()) // This month
        : subMonths(new Date(), months);

    setFilters((prev) => ({
      ...prev,
      dateRange: { from: start, to: end },
    }));
  };

  const selectOneYear = () => {
    const end = new Date();
    const start = subYears(new Date(), 1);
    setFilters((prev) => ({
      ...prev,
      dateRange: { from: start, to: end },
    }));
  };

  // 필터 적용 (백엔드 요청을 위해 부모로 전달)
  const handleApply = () => onApplyFilter(filters);

  // 초기화
  const handleReset = () => {
    const resetState = {
      keyword: "",
      categoryIds: [],
      dateRange: undefined,
      minAmount: "",
      maxAmount: "",
    };
    setFilters(resetState);
    onApplyFilter(resetState);
  };

  const selectedCategories = categories.filter((c) =>
    filters?.categoryIds?.includes(c.id)
  );

  return (
    <aside className="w-full min-w-[280px] animate-in slide-in-from-right-2 duration-300">
      <div className="sticky top-6 flex flex-col gap-4">
        <Card className="shadow-md border-slate-200 ring-1 ring-black/5 bg-white/95 backdrop-blur">
          <CardHeader className="pb-3 border-b bg-slate-50/80 flex flex-row items-center justify-between p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Search className="h-4 w-4" /> 필터링
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500"
                onClick={handleReset}
              >
                초기화
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={onClose}
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            {/* 검색어 */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase">
                검색어
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={filters.keyword}
                  onChange={(e) => updateFilter("keyword", e.target.value)}
                  placeholder="내역 검색..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase">
                카테고리
              </Label>
              <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 text-sm font-normal"
                  >
                    {filters.categoryIds.length > 0
                      ? `${filters.categoryIds.length}개 선택됨`
                      : "카테고리 선택"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="카테고리 검색..." />
                    <CommandList>
                      <CommandEmpty>결과 없음</CommandEmpty>
                      <CommandGroup heading="카테고리 목록">
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => toggleCategory(category.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.categoryIds.includes(category.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="mr-2">{category.icon}</span>{" "}
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategories.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="text-[10px] gap-1"
                  >
                    {c.icon} {c.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleCategory(c.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* 날짜 범위 */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                조회 기간
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectDatePreset(0)}
                  className="h-8 text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                >
                  이번달
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectDatePreset(3)}
                  className="h-8 text-xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                >
                  3개월
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectDatePreset(6)}
                  className="h-8 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  6개월
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectOneYear}
                  className="h-8 text-xs hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                >
                  1년
                </Button>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 bg-white hover:bg-slate-50 border-slate-200",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "yy.MM.dd")} -{" "}
                          {format(filters.dateRange.to, "yy.MM.dd")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "yy.MM.dd")
                      )
                    ) : (
                      <span>기간 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) =>
                      setFilters((prev) => ({ ...prev, dateRange: range }))
                    }
                    numberOfMonths={2}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* 금액 범위 */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase">
                금액 범위
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter("minAmount", e.target.value)}
                  className="h-9 text-xs"
                />
                <span className="text-slate-400">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter("maxAmount", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleApply}
              className="w-full h-10 text-sm font-bold bg-slate-800 hover:bg-slate-900 shadow-md"
            >
              필터 적용
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
