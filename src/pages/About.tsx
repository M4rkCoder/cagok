import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Info,
  ShieldCheck,
  Database,
  HardDrive,
  Heart,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PrivacyPolicy from "./PrivacyPolicy";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useTranslation } from "react-i18next"; // i18n 훅 추가

const About = () => {
  const { t } = useTranslation(); // 번역 함수 가져오기
  const { resetHeader, setHeader } = useHeaderStore();

  useEffect(() => {
    setHeader(t("menu.about")); // "앱 정보" -> 다국어 처리
    return () => resetHeader();
  }, [t, setHeader, resetHeader]);

  return (
    <div className="max-w-3xl mx-auto p-5 px-4 space-y-6">
      <Card className="border-none shadow-md bg-white overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Info className="w-20 h-20" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">C'AGOK</h1>
          <p className="text-blue-100 opacity-90 font-medium">
            {t("about.hero_subtitle")} {/* "개인용 로컬 가계부 서비스" */}
          </p>
          <div className="mt-4 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            Version 1.0.0
          </div>
        </div>

        <CardContent className="p-8 space-y-8">
          {/* Introduction */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              {t("about.intro_title")} {/* "차곡차곡 쌓이는 나의 자산" */}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t("about.intro_description")}
              {/* "C'AGOK은 사용자가 직접 입력하여 소비 습관을..." */}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 transition-colors hover:bg-slate-100/50">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800">
                  {t("about.feature_local_title")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  {t("about.feature_local_desc")}
                </p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 transition-colors hover:bg-slate-100/50">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-800">
                  {t("about.feature_sync_title")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  {t("about.feature_sync_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Policy Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">
                      {t("about.privacy_title")}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t("about.privacy_subtitle")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
              {/* PrivacyPolicy 컴포넌트 내부도 i18n 처리가 되어있어야 합니다 */}
              <PrivacyPolicy />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <p className="text-center text-slate-400 text-[10px] tracking-widest uppercase">
        © 2026 C'agok Project. Crafted with passion.
      </p>
    </div>
  );
};

export default About;
