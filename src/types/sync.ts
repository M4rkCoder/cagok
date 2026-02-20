export interface OneDriveStatus {
  is_connected: boolean;
  last_synced: string | null;
  account_name: string | null;
  account_email: string | null;
}
