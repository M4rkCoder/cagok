import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Lock, EyeOff, CloudOff, HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next"; // i18n 훅 임포트

const PrivacyPolicy = () => {
  const { t } = useTranslation(); // 번역 함수 사용

  return (
    <ScrollArea className="h-full w-full max-h-[80vh]">
      <div className="p-4 md:p-6">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="border-b border-slate-100 pb-6 px-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <CardTitle className="text-2xl font-bold text-slate-800">
                {t("privacy.title")}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="py-8 px-0 space-y-10">
            {/* 1. 데이터 수집 금지 원칙 */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-slate-400" />
                {t("privacy.section1_title")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t("privacy.section1_desc_1")}
                <strong> {t("privacy.section1_desc_bold")}</strong>
                {t("privacy.section1_desc_2")}
              </p>
            </section>

            {/* 2. 데이터 저장 방식 */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-slate-400" />
                {t("privacy.section2_title")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t("privacy.section2_desc_1")}
                <strong> {t("privacy.section2_desc_bold")}</strong>
                {t("privacy.section2_desc_2")}
              </p>
            </section>

            {/* 3. 제3자 제공 및 위탁 */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CloudOff className="w-5 h-5 text-slate-400" />
                {t("privacy.section3_title")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t("privacy.section3_desc")}
              </p>
            </section>

            {/* 하단 강조 박스 */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-900">
                  {t("privacy.footer_badge_title")}
                </p>
                <p className="text-xs text-emerald-700 leading-normal">
                  {t("privacy.footer_badge_desc_1")} <br />
                  {t("privacy.footer_badge_desc_2")}
                </p>
              </div>
            </div>

            <div className="pt-6 text-slate-400 text-[11px] border-t border-slate-100">
              {t("privacy.effective_date")}: 2026-02-26
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default PrivacyPolicy;
