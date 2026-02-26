import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Table,
  CheckCircle2,
  LayoutList,
  Wallet,
  Globe,
  Coins,
  Calendar,
} from "lucide-react";
import FinanceModeRounded from "@/components/FinanceModeRounded";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const [appName, setAppName] = useState("");
  const [language, setLanguage] = useState("ko");
  const [currency, setCurrency] = useState("KRW");
  const [defaultView, setDefaultView] = useState("timeline");
  const [dateFormat, setDateFormat] = useState("yyyy/MM/dd");

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const handleStart = async () => {
    await invoke("initialize_app", {
      appName,
      language,
      currency,
      defaultView,
      dateFormat,
    });
    window.location.reload();
  };

  const getDateExample = (pattern: string, lang: string) => {
    try {
      const dateLocale = lang === "ko" ? ko : enUS;
      return format(new Date(), pattern, { locale: dateLocale });
    } catch {
      return format(new Date(), pattern);
    }
  };

  const activeTabClass =
    "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-blue-200 border border-transparent";

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50/50 p-4">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-blue-500 overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8 bg-white border-b border-slate-100">
          <div className="mx-auto bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
            <FinanceModeRounded className="w-10 h-10 text-white bg-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">
            {t("onboarding.welcome")}
          </CardTitle>
          <CardDescription className="text-base text-slate-500">
            {t("onboarding.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 px-10 py-3 bg-white/50">
          {/* 1. 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label
                htmlFor="appName"
                className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1"
              >
                <Wallet className="w-4 h-4 text-blue-500" />{" "}
                {t("onboarding.app_name_label")}
              </Label>
              <Input
                id="appName"
                className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-100 transition-all"
                placeholder={t("onboarding.app_name_placeholder")}
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <Globe className="w-4 h-4 text-blue-500" />{" "}
                {t("onboarding.language_label")}
              </Label>
              <Tabs
                value={language}
                onValueChange={handleLanguageChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 h-11 p-1">
                  <TabsTrigger
                    value="ko"
                    className={cn("text-xs transition-all", activeTabClass)}
                  >
                    🇰🇷 한국어
                  </TabsTrigger>
                  <TabsTrigger
                    value="en"
                    className={cn("text-xs transition-all", activeTabClass)}
                  >
                    🇺🇸 English
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* 2. 형식 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <Calendar className="w-4 h-4 text-blue-500" />{" "}
                {t("onboarding.date_format_label")}
              </Label>
              <Tabs
                value={dateFormat}
                onValueChange={setDateFormat}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 h-14 p-1">
                  <TabsTrigger
                    value="yyyy/MM/dd"
                    className={cn("flex flex-col gap-0.5", activeTabClass)}
                  >
                    <span className="text-[11px] font-bold">
                      {t("onboarding.date_format_numeric")}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {getDateExample("yyyy/MM/dd", language)}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="MMM dd, yyyy"
                    className={cn("flex flex-col gap-0.5", activeTabClass)}
                  >
                    <span className="text-[11px] font-bold">
                      {t("onboarding.date_format_text")}
                    </span>
                    <span className="text-[10px] opacity-70">
                      {getDateExample("MMM dd, yyyy", language)}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <Coins className="w-4 h-4 text-blue-500" />{" "}
                {t("onboarding.currency_label")}
              </Label>
              <Tabs
                value={currency}
                onValueChange={setCurrency}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-slate-100 h-14 p-1">
                  <TabsTrigger
                    value="KRW"
                    className={cn("text-xs font-bold", activeTabClass)}
                  >
                    KRW (₩)
                  </TabsTrigger>
                  <TabsTrigger
                    value="USD"
                    className={cn("text-xs font-bold", activeTabClass)}
                  >
                    USD ($)
                  </TabsTrigger>
                  <TabsTrigger
                    value="EUR"
                    className={cn("text-xs font-bold", activeTabClass)}
                  >
                    EUR (€)
                  </TabsTrigger>
                  <TabsTrigger
                    value="GBP"
                    className={cn("text-xs font-bold", activeTabClass)}
                  >
                    GBP (£)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* 3. 가계부 화면 */}
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
              <LayoutList className="w-4 h-4 text-blue-500" />{" "}
              {t("onboarding.default_view_label")}
            </Label>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  id: "timeline",
                  label: t("onboarding.view_timeline"),
                  icon: LayoutList,
                  desc: t("onboarding.view_timeline_desc"),
                },
                {
                  id: "calendar",
                  label: t("onboarding.view_calendar"),
                  icon: CalendarDays,
                  desc: t("onboarding.view_calendar_desc"),
                },
                {
                  id: "board",
                  label: t("onboarding.view_board"),
                  icon: Table,
                  desc: t("onboarding.view_board_desc"),
                },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setDefaultView(view.id)}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border transition-all active:scale-95",
                    defaultView === view.id
                      ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20 shadow-sm"
                      : "border-slate-200 hover:border-blue-200 bg-white",
                  )}
                >
                  {defaultView === view.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                  <view.icon
                    className={cn(
                      "w-5 h-5 mb-2",
                      defaultView === view.id
                        ? "text-blue-600"
                        : "text-slate-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold mb-0.5",
                      defaultView === view.id
                        ? "text-blue-700"
                        : "text-slate-700",
                    )}
                  >
                    {view.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {view.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-10 pb-10 pt-4 bg-white border-t border-slate-50">
          <Button
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98] text-white"
            onClick={handleStart}
            disabled={!appName.trim()}
          >
            {t("onboarding.submit_button")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
