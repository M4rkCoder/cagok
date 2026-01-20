import FinanceModeRounded from "./FinanceModeRounded";

interface IconWithBgProps {
  bgClass?: string;
  iconClass?: string;
}

export function FinkroIcon({
  bgClass = "bg-muted",
  iconClass = "text-foreground",
}: IconWithBgProps) {
  return (
    <div className={`p-2 rounded-md ${bgClass}`}>
      <FinanceModeRounded className={`w-5 h-5 ${iconClass}`} />
    </div>
  );
}
