use std::time::SystemTime;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use url::Url;
use oauth2::{
    basic::BasicClient, AuthUrl, ClientId, CsrfToken,
    RedirectUrl, Scope, TokenUrl, TokenResponse,
    PkceCodeChallenge,
};
use tiny_http::{Server, Response};
use tauri::{AppHandle, Manager, Runtime};
use crate::db::DbConnection;
use tauri_plugin_opener::OpenerExt;

const CLIENT_ID: &str = "5e569a9c-cb58-4d46-9199-8ca1b4eda552";
const AUTH_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const REDIRECT_URI: &str = "http://localhost:8080/callback"; // Needs to match Azure App registration
// Changed scope to Files.ReadWrite.All to ensure access to root folder and subfolders
const SCOPES: &[&str] = &["Files.ReadWrite.All", "offline_access", "User.Read"];

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OneDriveStatus {
    pub is_connected: bool,
    pub last_synced: Option<String>,
    pub account_name: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct TokenData {
    access_token: String,
    refresh_token: Option<String>,
    expires_at: u64, // Unix timestamp
}

// Store tokens in DB (app_settings)
fn save_tokens(conn: &Connection, tokens: &TokenData) -> Result<(), String> {
    let json = serde_json::to_string(tokens).map_err(|e| e.to_string())?;
    crate::db::repository::set_setting(conn, "onedrive_tokens", &json).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_tokens(conn: &Connection) -> Result<Option<TokenData>, String> {
    let json = crate::db::repository::get_setting(conn, "onedrive_tokens").map_err(|e| e.to_string())?;
    if let Some(j) = json {
        if j.trim().is_empty() {
            return Ok(None);
        }
        let data: TokenData = serde_json::from_str(&j).map_err(|e| e.to_string())?;
        Ok(Some(data))
    } else {
        Ok(None)
    }
}

pub async fn login<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    let client = BasicClient::new(
            ClientId::new(CLIENT_ID.to_string()),
            None,
            AuthUrl::new(AUTH_URL.to_string()).map_err(|e| e.to_string())?,
            Some(TokenUrl::new(TOKEN_URL.to_string()).map_err(|e| e.to_string())?),
        )
        .set_redirect_uri(RedirectUrl::new(REDIRECT_URI.to_string()).map_err(|e| e.to_string())?);

    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let auth_url = client
        .authorize_url(CsrfToken::new_random)
        .add_scopes(SCOPES.iter().map(|s| Scope::new(s.to_string())))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // Start local server to listen for callback
    let server = Server::http("127.0.0.1:8080").map_err(|e| format!("Failed to start local server: {}", e))?;
    
    // Open the browser
    app_handle.opener().open_url(auth_url.0.as_str(), None::<&str>).map_err(|e| e.to_string())?;

    // Wait for request
    let code = tokio::task::spawn_blocking(move || {
        if let Ok(request) = server.recv() {
            let url = request.url().to_string();
            // Parse URL to get code
            let url_obj = Url::parse(&format!("http://localhost:8080{}", url)).map_err(|_| "Failed to parse URL")?;
            let pairs = url_obj.query_pairs();
            let mut code = None;
            for (key, value) in pairs {
                if key == "code" {
                    code = Some(value.into_owned());
                }
            }
            
            // Respond to browser
            let response = Response::from_string("Login successful! You can close this window and return to the app.");
            let _ = request.respond(response);
            
            code.ok_or("No code found in callback")
        } else {
            Err("Failed to receive request")
        }
    }).await.map_err(|e| e.to_string())??;

    // Exchange code for token
    let token_result = client
        .exchange_code(oauth2::AuthorizationCode::new(code))
        .set_pkce_verifier(pkce_verifier)
        .request_async(oauth2::reqwest::async_http_client)
        .await
        .map_err(|e| {
             match e {
                 oauth2::RequestTokenError::ServerResponse(err) => {
                     let desc = err.error_description().map(|s| s.as_str()).unwrap_or("No description provided");
                     format!("Token exchange failed: {} (Description: {})", err.error(), desc)
                 },
                 _ => format!("Token exchange failed: {}", e)
             }
        })?;

    let access_token = token_result.access_token().secret().clone();
    let refresh_token = token_result.refresh_token().map(|t| t.secret().clone());
    let expires_in = token_result.expires_in().unwrap_or(std::time::Duration::from_secs(3600));
    let expires_at = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() + expires_in.as_secs();

    let token_data = TokenData {
        access_token,
        refresh_token,
        expires_at,
    };

    // Save to DB
    let state = app_handle.state::<DbConnection>();
    let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
    save_tokens(&conn, &token_data)?;

    Ok("Login successful".to_string())
}

pub async fn get_valid_token<R: Runtime>(app_handle: &AppHandle<R>) -> Result<String, String> {
    let state = app_handle.state::<DbConnection>();
    // We need to release the lock quickly
    let token_data = {
        let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
        get_tokens(&conn)?
    };

    let mut data = token_data.ok_or("Not logged in")?;
    let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();

    if now >= data.expires_at - 60 {
        // Refresh
        if let Some(refresh_token) = data.refresh_token {
            let client = BasicClient::new(
                ClientId::new(CLIENT_ID.to_string()),
                None,
                AuthUrl::new(AUTH_URL.to_string()).unwrap(),
                Some(TokenUrl::new(TOKEN_URL.to_string()).unwrap())
            );

        let token_result = client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token.clone()))
            .request_async(oauth2::reqwest::async_http_client)
            .await
            .map_err(|e| {
                 match e {
                     oauth2::RequestTokenError::ServerResponse(err) => {
                         let desc = err.error_description().map(|s| s.as_str()).unwrap_or("No description provided");
                         format!("Token refresh failed: {} (Description: {})", err.error(), desc)
                     },
                     _ => format!("Token refresh failed: {}", e)
                 }
            })?;

            let access_token = token_result.access_token().secret().clone();
            let new_refresh_token = token_result.refresh_token().map(|t| t.secret().clone());
            let expires_in = token_result.expires_in().unwrap_or(std::time::Duration::from_secs(3600));
            let expires_at = now + expires_in.as_secs();

            data = TokenData {
                access_token: access_token.clone(),
                refresh_token: new_refresh_token.or(Some(refresh_token)), // Keep old if no new one
                expires_at,
            };

            // Save new tokens
            let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
            save_tokens(&conn, &data)?;
            
            Ok(access_token)
        } else {
            Err("Session expired, please login again".to_string())
        }
    } else {
        Ok(data.access_token)
    }
}

pub async fn logout<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), String> {
    let state = app_handle.state::<DbConnection>();
    let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
    crate::db::repository::set_setting(&conn, "onedrive_tokens", "").map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn backup_db<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    let token = get_valid_token(&app_handle).await?;
    let client = Client::new();

    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_dir.join("cagok.db");
    
    // We need to read the file.
    // If SQLite has it locked, we might need to copy it first?
    // Usually read sharing is allowed.
    let content = std::fs::read(&db_path).map_err(|e| format!("Failed to read DB: {}", e))?;

    // Upload to /Apps/Cagok/cagok.db in OneDrive Root
    let url = "https://graph.microsoft.com/v1.0/me/drive/root:/Apps/Cagok/cagok.db:/content";
    
    let res = client.put(url)
        .bearer_auth(token)
        .body(content)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let state = app_handle.state::<DbConnection>();
        let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
        let now = chrono::Local::now().to_rfc3339();
        crate::db::repository::set_setting(&conn, "last_onedrive_sync", &now).map_err(|e| e.to_string())?;
        Ok("Backup successful".to_string())
    } else {
        let err_text = res.text().await.unwrap_or_default();
        Err(format!("Upload failed: {}", err_text))
    }
}

pub async fn restore_db<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    let token = get_valid_token(&app_handle).await?;
    let client = Client::new();

    let url = "https://graph.microsoft.com/v1.0/me/drive/root:/Apps/Cagok/cagok.db:/content";
    
    let res = client.get(url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Download failed: {}", res.status()));
    }

    let content = res.bytes().await.map_err(|e| e.to_string())?;

    // Save to a temporary file first
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let temp_path = app_dir.join("cagok_restore.db");
    let db_path = app_dir.join("cagok.db");

    std::fs::write(&temp_path, content).map_err(|e| e.to_string())?;

    // Now the tricky part: Replacing the DB while running.
    // We need to close the current connection.
    let state = app_handle.state::<DbConnection>();
    {
        let mut guard = state.0.lock().map_err(|_| "Failed to lock DB")?;
        // Replace connection with in-memory to release file lock
        let old_conn = std::mem::replace(&mut *guard, Connection::open_in_memory().unwrap());
        drop(old_conn); // This closes the file handle

        // Now replace the file
        // Retry a few times if needed?
        if let Err(e) = std::fs::rename(&temp_path, &db_path) {
            // If rename fails (maybe due to other locks?), try copy and delete
             if let Err(e2) = std::fs::copy(&temp_path, &db_path) {
                  // If that fails, restore the connection and error out
                  *guard = Connection::open(&db_path).map_err(|e| e.to_string())?;
                  return Err(format!("Failed to replace DB file: {} / {}", e, e2));
             }
             let _ = std::fs::remove_file(&temp_path);
        }

        // Re-open connection
        *guard = Connection::open(&db_path).map_err(|e| e.to_string())?;
        
        // Ensure PRAGMAs are set again if needed (Foreign keys etc)
        guard.execute("PRAGMA foreign_keys = ON;", []).map_err(|e| e.to_string())?;
    }

    Ok("Restore successful".to_string())
}

pub async fn check_status<R: Runtime>(app_handle: AppHandle<R>) -> Result<OneDriveStatus, String> {
    let state = app_handle.state::<DbConnection>();
    let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
    
    let token_data = get_tokens(&conn)?;
    let last_synced = crate::db::repository::get_setting(&conn, "last_onedrive_sync").map_err(|e| e.to_string())?;

    Ok(OneDriveStatus {
        is_connected: token_data.is_some(),
        last_synced,
        account_name: None, // Could fetch from Graph API /me endpoint
    })
}
