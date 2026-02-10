import { useState, useEffect } from "react";
import { Search, ChevronRight, Check, ChevronsUpDown, CalendarIcon, X } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
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
import { Category } from "@/types";
import { useAppStore } from "@/store/useAppStore"; // For categories
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
  onApplyFilter: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export function TransactionFilterPanel({ onClose, onApplyFilter, initialFilters }: Props) {
  const { categories } = useAppStore();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [openCategory, setOpenCategory] = useState(false);

  // Sync internal state if props change (optional, but good practice)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
  };

  const toggleCategory = (id: number) => {
    setFilters((prev) => {
      const currentIds = prev.categoryIds;
      if (currentIds.includes(id)) {
        return { ...prev, categoryIds: currentIds.filter((c) => c !== id) };
      } else {
        return { ...prev, categoryIds: [...currentIds, id] };
      }
    });
  };

  const selectDatePreset = (months: number) => {
    const end = new Date();
    const start = months === 0 
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

  const handleApply = () => {
    onApplyFilter(filters);
  };
  
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
    filters.categoryIds.includes(c.id)
  );

  return (
    <aside className="w-full min-w-[280px] animate-in slide-in-from-right-2 duration-300">
      <div className="sticky top-6 flex flex-col gap-4">
        <Card className="shadow-md border-slate-200 ring-1 ring-black/5 bg-white/95 backdrop-blur">
          <CardHeader className="pb-3 border-b bg-slate-50/80 flex flex-row items-center justify-between p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Search className="h-4 w-4" />
              필터링
            </CardTitle>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500 hover:text-slate-900 px-2"
                    onClick={handleReset}
                >
                    초기화
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-slate-200 rounded-full"
                onClick={onClose}
                >
                <ChevronRight className="h-4 w-4 text-slate-500" />
                </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
            {/* Keyword Search */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                검색어 (내용/메모)
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="내역 검색..."
                  value={filters.keyword}
                  onChange={handleKeywordChange}
                  className="pl-9 h-9 text-sm border-slate-200 focus:ring-1 focus:ring-slate-400 bg-white"
                />
              </div>
            </div>

            <Separator />

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                카테고리
              </Label>
              <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategory}
                    className="w-full justify-between h-9 text-sm font-normal border-slate-200 bg-white hover:bg-slate-50"
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
                      <CommandGroup heading="수입">
                        {categories
                          .filter((c) => c.type === 0)
                          .map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => toggleCategory(category.id)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.categoryIds.includes(category.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="mr-2 text-lg">{category.icon}</span>
                              {category.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                      <CommandGroup heading="지출">
                        {categories
                          .filter((c) => c.type === 1)
                          .map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => toggleCategory(category.id)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.categoryIds.includes(category.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="mr-2 text-lg">{category.icon}</span>
                              {category.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Selected Categories Badges */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCategories.map((c) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
                    >
                      <span>{c.icon}</span>
                      {c.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => toggleCategory(c.id)}
                      />
                    </Badge>
                  ))}
                  {selectedCategories.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1 text-slate-400 hover:text-red-500" onClick={() => setFilters(prev => ({ ...prev, categoryIds: [] }))}>
                          전체 해제
                      </Button>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Date Range Filter */}
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

            {/* Amount Range Filter */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                금액 범위
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-2 top-2.5 text-xs text-slate-400">₩</span>
                    <Input
                    placeholder="최소"
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="h-9 text-xs pl-6 border-slate-200 bg-white"
                    />
                </div>
                <span className="text-slate-400 text-xs">~</span>
                <div className="relative flex-1">
                    <span className="absolute left-2 top-2.5 text-xs text-slate-400">₩</span>
                    <Input
                    placeholder="최대"
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="h-9 text-xs pl-6 border-slate-200 bg-white"
                    />
                </div>
              </div>
            </div>

            <Button 
                onClick={handleApply}
                className="w-full h-10 text-sm font-bold bg-slate-800 hover:bg-slate-900 shadow-md mt-4"
            >
              필터 적용
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}