import { useRecurringListener } from "@/hooks/useRecurringListener";
import { useAutoBackupNotification } from "@/hooks/useAutoBackupNotification";

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useRecurringListener();
  useAutoBackupNotification();

  return <>{children}</>;
};
