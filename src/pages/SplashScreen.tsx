import FinanceModeRounded from "@/components/FinanceModeRounded";

export default function SplashScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <FinanceModeRounded className="w-40 h-40 text-blue-500" />
      <h1 className="tracking-wide scroll-m-20 text-center text-4xl font-extrabold text-blue-500 text-balance">
        FINKRO
      </h1>
    </div>
  );
}
