import { useRecurringListener } from "@/hooks/useRecurringListener";

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useRecurringListener();

  return <>{children}</>;
};
