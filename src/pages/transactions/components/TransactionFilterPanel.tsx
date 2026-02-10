import { Search, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onClose: () => void;
}

export function TransactionFilterPanel({ onClose }: Props) {
  return (
    <aside className="w-[20%] min-w-[260px] animate-in slide-in-from-right-2 duration-300">
      <div className="sticky top-6 flex flex-col gap-4">
        <Card className="shadow-md border-slate-200 ring-1 ring-black/5 bg-white/95 backdrop-blur">
          <CardHeader className="pb-3 border-b bg-slate-50/80 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Search className="h-4 w-4" />
              조회 필터
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-slate-200"
              onClick={onClose}
            >
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                검색어
              </Label>
              <Input
                placeholder="내역 검색..."
                className="h-9 text-sm border-slate-200 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                거래 유형
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-medium border-slate-200"
                >
                  수입
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-medium border-slate-200"
                >
                  지출
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                금액 범위
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Min"
                  className="h-9 text-xs border-slate-200"
                />
                <Input
                  placeholder="Max"
                  className="h-9 text-xs border-slate-200"
                />
              </div>
            </div>

            <Button className="w-full h-10 text-sm font-bold bg-slate-800 hover:bg-slate-900 shadow-md">
              필터 적용
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
