export interface OneDriveStatus {
  is_connected: boolean;
  last_synced: string | null;
  account_name: string | null;
  account_email: string | null;
}

export interface SyncCheckResult {
  needs_update: boolean;
  cloud_time: string;
  local_time: string;
}
