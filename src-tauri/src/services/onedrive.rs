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
use tiny_http::Server;
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_opener::OpenerExt;
use crate::db::DbConnection;

const CLIENT_ID: &str = "5e569a9c-cb58-4d46-9199-8ca1b4eda552";
const AUTH_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL: &str = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const REDIRECT_URI: &str = "http://localhost:8080/callback";
const SCOPES: &[&str] = &["Files.ReadWrite.All", "offline_access", "User.Read"];

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OneDriveStatus {
    pub is_connected: bool,
    pub last_synced: Option<String>,
    pub account_name: Option<String>,
    pub account_email: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct TokenData {
    access_token: String,
    refresh_token: Option<String>,
    expires_at: u64, // Unix timestamp
}

#[derive(Deserialize)]
struct GraphMeResponse {
    #[serde(rename = "displayName")]
    display_name: String,
    #[serde(rename = "userPrincipalName")]
    user_principal_name: String,
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

    let (authorize_url, _csrf_token) = client
    .authorize_url(CsrfToken::new_random)
    .add_scopes(SCOPES.iter().map(|s| Scope::new(s.to_string())))
    .set_pkce_challenge(pkce_challenge)
    .url();

// 2. 이제 authorize_url은 순수한 URL 객체이므로 .to_string()이 작동합니다.
app_handle.opener().open_url(authorize_url.to_string(), None::<String>)
    .map_err(|e| format!("브라우저를 열 수 없습니다: {}", e))?;

        let server = Server::http("127.0.0.1:8080").map_err(|e| format!("서버 시작 실패: {}", e))?;
        
        let logo_svg = r#"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true' role='img'><path fill='#ffffff' d='M8 11.75V7.5q0-.625.438-1.062T9.5 6t1.063.438T11 7.5v4.25q0 .625-.437 1.063T9.5 13.25t-1.062-.437T8 11.75m5-.225V3.5q0-.625.438-1.062T14.5 2t1.063.438T16 3.5v8.025q0 .75-.462 1.125t-1.038.375t-1.037-.375T13 11.525m-10 3.45V11.5q0-.625.438-1.062T4.5 10t1.063.438T6 11.5v3.475q0 .75-.462 1.125t-1.038.375t-1.037-.375T3 14.975m2.4 6.075q-.65 0-.913-.612T4.7 19.35l4.1-4.1q.275-.275.663-.3t.687.25L13 17.65l5.6-5.6H18q-.425 0-.712-.288T17 11.05t.288-.712t.712-.288h3q.425 0 .713.288t.287.712v3q0 .425-.288.713T21 15.05t-.712-.288T20 14.05v-.6l-6.25 6.25q-.275.275-.663.3t-.687-.25L9.55 17.3L6.1 20.75q-.125.125-.312.213t-.388.087'/></svg>"#;

        let app_handle_for_block = app_handle.clone();

        let code = tokio::task::spawn_blocking::<_, Result<String, String>>(move || {
            if let Ok(request) = server.recv() {
                // URL 파싱 (map_err 시 String으로 변환)
                let url_obj = Url::parse(&format!("http://localhost:8080{}", request.url()))
                    .map_err(|e| e.to_string())?;
                
                let auth_code = url_obj.query_pairs()
                    .find(|(k, _)| k == "code")
                    .map(|(_, v)| v.into_owned());
        
                

let lang = app_handle_for_block.state::<DbConnection>().0.lock()
    .map_err(|_| "DB 잠금 실패")
    .and_then(|conn| {
        // get_setting이 Result<Option<String>>을 반환한다고 가정할 때:
        Ok(crate::db::repository::get_setting(&conn, "language")
            .unwrap_or(None)           // Result를 Option으로 변환
            .unwrap_or("en".to_string())) // Option이 None이면 "en" 반환
    })
    .unwrap_or_else(|_| "en".to_string()); // DB 실패 시 최종 기본값 "en"

    let (title, header, msg, note) = match lang.as_str() {
        "ko" => (
            "인증 완료",
            "인증 성공!",
            "로그인에 성공했습니다.",
            "창을 닫고 앱으로 돌아가주세요."
        ),
        _ => (
            "Authentication Complete",
            "Success!",
            "You have been successfully logged in.",
            "Please close this tab and return to the app."
        ),
    };
    
    let html = format!(r#"
    <!DOCTYPE html>
    <html lang="{lang}">
    <head>
        <meta charset="utf-8">
        <style>
            @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
            
            body {{ 
                font-family: 'Pretendard', sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #e5e7eb; 
            }}
            .card {{ 
                max-width: 420px; 
                width: 90%; 
                background: white; 
                padding: 60px 40px; 
                border-radius: 32px; 
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
                text-align: center; 
            }}
            
            .logo-box {{
                width: 80px;
                height: 80px;
                background-color: #2563eb;
                border-radius: 20px;
                margin: 0 auto 16px;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
            }}
            .logo-box svg {{ width: 48px; height: 48px; }}

            .app-title {{ 
                color: #2563eb; 
                font-size: 1.1rem; 
                font-weight: 800; 
                margin-bottom: 32px;
                letter-spacing: 0.05em;
            }}

            h1 {{ color: #0f172a; font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em; }}
            .status-msg {{ color: #334155; font-size: 1.1rem; font-weight: 500; margin-bottom: 40px; }}
            
            .divider {{ height: 1px; background-color: #e2e8f0; margin-bottom: 24px; }}
            
            .note {{ 
                font-size: 0.95rem; 
                color: #64748b; 
                font-weight: 400;
            }}
        </style>
        <title>{title}</title>
    </head>
    <body>
        <div class="card">
            <div class="logo-box">{logo_svg}</div>
            <div class="app-title">C'AGOK</div>

            <h1>{header}</h1>
            <p class="status-msg">{msg}</p>
            
            <div class="divider"></div>
            <p class="note">{note}</p>
        </div>
    </body>
    </html>
"#, lang=lang, title=title, header=header, msg=msg, note=note, logo_svg=logo_svg);

// 응답 전송
let response = tiny_http::Response::from_string(html)
    .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap());

request.respond(response).map_err(|e| e.to_string())?;

// 인증 코드 반환
return auth_code.ok_or_else(|| "인증 코드를 찾을 수 없습니다.".to_string());
}
Err("요청 대기 중 오류가 발생했습니다.".to_string())
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

    let access_token_secret = token_result.access_token().secret().clone();
    let refresh_token = token_result.refresh_token().map(|t| t.secret().clone());
    let expires_in = token_result.expires_in().unwrap_or(std::time::Duration::from_secs(3600));
    let expires_at = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() + expires_in.as_secs();

    let client_http = reqwest::Client::new();
    let user_info_data = match client_http
        .get("https://graph.microsoft.com/v1.0/me")
        .bearer_auth(&access_token_secret)
        .send()
        .await 
    {
        Ok(res) if res.status().is_success() => {
            res.json::<GraphMeResponse>().await.ok()
        },
        _ => None,
    };

    let token_data = TokenData {
        access_token: access_token_secret,
        refresh_token,
        expires_at,
    };

    let state = app_handle.state::<DbConnection>();
    let conn = state.0.lock().map_err(|_| "Failed to lock DB")?;
    
    // 1. 토큰 저장
    save_tokens(&conn, &token_data)?;

    // 2. [추가] 이름과 이메일 주소를 각각 DB에 저장
    if let Some(info) = user_info_data {
        let _ = crate::db::repository::set_setting(&conn, "onedrive_user_name", &info.display_name).map_err(|e| e.to_string())?;
        let _ = crate::db::repository::set_setting(&conn, "onedrive_user_email", &info.user_principal_name).map_err(|e| e.to_string())?;
    }

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

    crate::db::repository::set_setting(&conn, "onedrive_tokens", "")
        .map_err(|e| format!("Failed to delete token: {}", e))?;

    crate::db::repository::set_setting(&conn, "onedrive_user_name", "")
        .map_err(|e| format!("Failed to delete user name: {}", e))?;

    crate::db::repository::set_setting(&conn, "onedrive_user_email", "")
        .map_err(|e| format!("Failed to delete user email: {}", e))?;
    crate::db::repository::set_setting(&conn, "last_onedrive_sync", "").ok();

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
    let is_connected = token_data.is_some();
    let last_synced = crate::db::repository::get_setting(&conn, "last_onedrive_sync").map_err(|e| e.to_string())?;
    let (account_name, account_email) = if is_connected {
        let name = crate::db::repository::get_setting(&conn, "onedrive_user_name").ok().flatten();
        let email = crate::db::repository::get_setting(&conn, "onedrive_user_email").ok().flatten();
        (name, email)
    } else {
        (None, None)
    };

    Ok(OneDriveStatus {
        is_connected,
        last_synced,
        account_name,
        account_email,
    })
}
