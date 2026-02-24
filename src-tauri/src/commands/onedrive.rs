use tauri::{AppHandle, command, Runtime};
use crate::services::onedrive;
use crate::services::onedrive::SyncCheckResult;

#[command]
pub async fn onedrive_login<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    onedrive::login(app_handle).await
}

#[command]
pub async fn onedrive_logout<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), String> {
    onedrive::logout(app_handle).await
}

#[command]
pub async fn onedrive_backup<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    onedrive::backup_db(app_handle).await
}

#[command]
pub async fn onedrive_restore<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    onedrive::restore_db(app_handle).await
}

#[command]
pub async fn onedrive_check_status<R: Runtime>(app_handle: AppHandle<R>) -> Result<onedrive::OneDriveStatus, String> {
    onedrive::check_status(app_handle).await
}

#[command]
pub async fn check_onedrive_sync_status<R: Runtime>(app_handle: AppHandle<R>) -> Result<SyncCheckResult, String> {
    onedrive::check_sync_needed(&app_handle).await
}

#[command]
pub async fn onedrive_auto_sync<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    onedrive::auto_sync_check(app_handle).await
}