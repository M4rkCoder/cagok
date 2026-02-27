import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings,
  CalendarDays,
  Table,
  CheckCircle2,
  LayoutList,
  Coins,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/useAppStore";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

const GeneralSettings = () => {
  const { t } = useTranslation();
  const { resetHeader, setHeader } = useHeaderStore();
  const { language: globalLanguage } = useAppStore();
  const {
    appName: storeAppName,
    currency: storeCurrency,
    defaultView: storeDefaultView,
    dateFormat: storeDateFormat,
    fetchGeneralSettings,
    saveGeneralSettings,
  } = useSettingStore();

  const [localAppName, setLocalAppName] = useState("");
  const [localLanguage, setLocalLanguage] = useState("");
  const [localCurrency, setLocalCurrency] = useState("");
  const [localDefaultView, setLocalDefaultView] = useState("timeline");
  const [localDateFormat, setLocalDateFormat] = useState("yyyy/MM/dd");

  useEffect(() => {
    setHeader(t("settings.general.title"));
    fetchGeneralSettings();
    return () => resetHeader();
  }, []);

  useEffect(() => {
    setLocalAppName(storeAppName);
    setLocalCurrency(storeCurrency);
    setLocalDefaultView(storeDefaultView);
    setLocalDateFormat(storeDateFormat);
  }, [storeAppName, storeCurrency, storeDefaultView, storeDateFormat]);

  useEffect(() => {
    setLocalLanguage(globalLanguage);
  }, [globalLanguage]);

  const getDateExample = (pattern: string, lang: string) => {
    try {
      const dateLocale = lang === "ko" ? ko : enUS;
      return format(new Date(), pattern, { locale: dateLocale });
    } catch {
      return format(new Date(), pattern);
    }
  };

  const handleSaveSettings = async () => {
    await saveGeneralSettings({
      appName: localAppName,
      currency: localCurrency,
      defaultView: localDefaultView,
      language: localLanguage,
      dateFormat: localDateFormat,
    });
  };

  const activeTabClass =
    "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-blue-200 border border-transparent";

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle className="text-xl">
              {t("settings.general.title")}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 1. 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label
                htmlFor="appName"
                className="text-sm font-bold text-slate-700 ml-1"
              >
                {t("settings.general.app_name")}
              </Label>
              <Input
                id="appName"
                value={localAppName}
                onChange={(e) => setLocalAppName(e.target.value)}
                placeholder="C'agok"
                className="bg-slate-50/50 border-slate-200 focus:border-blue-400 transition-colors h-11"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 ml-1">
                {t("settings.general.language")}
              </Label>
              <Tabs
                value={localLanguage}
                onValueChange={setLocalLanguage}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/60 h-11 p-1">
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
              <Label className="text-sm font-bold text-slate-700 ml-1">
                {t("settings.general.date_format")}
              </Label>
              <Tabs
                value={localDateFormat}
                onValueChange={setLocalDateFormat}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/60 h-14 p-1">
                  <TabsTrigger
                    value="yyyy/MM/dd"
                    className={cn("flex flex-col gap-0.5", activeTabClass)}
                  >
                    <span className="text-[12px] font-bold">
                      {t("onboarding.date_format_numeric")}
                    </span>
                    <span className="text-[12px] opacity-80">
                      {getDateExample("yyyy/MM/dd", localLanguage)}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="MMM dd, yyyy"
                    className={cn("flex flex-col gap-0.5", activeTabClass)}
                  >
                    <span className="text-[12px] font-bold">
                      {t("onboarding.date_format_text")}
                    </span>
                    <span className="text-[12px] opacity-80">
                      {getDateExample("MMM dd, yyyy", localLanguage)}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                {t("settings.general.currency")}
              </Label>
              <Tabs
                value={localCurrency}
                onValueChange={setLocalCurrency}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-slate-100/60 h-14 p-1">
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
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
              {t("settings.general.default_view")}
            </h3>
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
                  onClick={() => setLocalDefaultView(view.id)}
                  className={cn(
                    "relative flex flex-col items-center p-5 rounded-xl border transition-all",
                    localDefaultView === view.id
                      ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  )}
                >
                  {localDefaultView === view.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                  <view.icon
                    className={cn(
                      "w-6 h-6 mb-3",
                      localDefaultView === view.id
                        ? "text-blue-600"
                        : "text-slate-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold mb-1",
                      localDefaultView === view.id
                        ? "text-blue-700"
                        : "text-slate-700"
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

          <div className="pt-3 flex justify-end">
            <Button
              onClick={handleSaveSettings}
              size="lg"
              className="w-full md:w-44 bg-slate-600 hover:bg-slate-700 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-white cursor-pointer"
            >
              {t("settings.general.save_button")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
