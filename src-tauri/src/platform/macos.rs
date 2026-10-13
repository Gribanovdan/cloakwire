//! macOS privilege elevation via osascript.
//!
//! Provides elevation for sing-box so it can configure `utun` interfaces and
//! system routes without requiring the entire Tauri application to run as root.
//! Sets SUID root on the binary (`chown root:wheel && chmod 4755`) via a native
//! AppleScript administrator prompt.

use std::path::Path;

#[cfg(target_os = "macos")]
use std::os::unix::fs::MetadataExt;

/// Check whether the binary at `path` is owned by root and has the SUID bit set.
#[cfg(target_os = "macos")]
pub fn is_binary_elevated(path: &Path) -> bool {
    match std::fs::metadata(path) {
        Ok(meta) => {
            let is_root_owner = meta.uid() == 0;
            let is_setuid = (meta.mode() & 0o4000) != 0;
            is_root_owner && is_setuid
        }
        Err(e) => {
            log::warn!("macos-elevation: failed to read metadata for {:?}: {e}", path);
            false
        }
    }
}

/// Fallback for non-macOS platforms.
#[cfg(not(target_os = "macos"))]
pub fn is_binary_elevated(_path: &Path) -> bool {
    true
}

/// Ensure that the binary at `path` is elevated (root SUID).
///
/// If the binary is already elevated, returns `Ok(())` immediately.
/// Otherwise, prompts the user using `osascript ... with administrator privileges`.
#[cfg(target_os = "macos")]
pub async fn ensure_binary_elevated(path: &Path) -> Result<(), String> {
    if is_binary_elevated(path) {
        log::info!("macos-elevation: binary at {:?} is already elevated (root SUID)", path);
        return Ok(());
    }

    if !path.exists() {
        return Err(format!("binary not found at {:?}", path));
    }

    let canonical = match path.canonicalize() {
        Ok(p) => p,
        Err(_) => path.to_path_buf(),
    };
    let path_str = canonical.to_string_lossy();

    log::info!("macos-elevation: requesting root SUID elevation via osascript for {:?}", canonical);

    // Escape single quotes for POSIX shell invocation inside AppleScript
    let safe_shell_path = path_str.replace('\'', "'\\''");
    let shell_cmd = format!("chown root:wheel '{safe_shell_path}' && chmod 4755 '{safe_shell_path}'");
    let safe_for_as = shell_cmd.replace('\\', "\\\\").replace('"', "\\\"");

    let prompt_msg = "Cloakwire requires administrator privileges to configure network TUN interfaces and routing.";
    let script = format!(
        "do shell script \"{}\" with administrator privileges with prompt \"{}\"",
        safe_for_as, prompt_msg
    );

    let output = tokio::process::Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .await
        .map_err(|e| format!("failed to launch osascript: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("elevation canceled or failed: {}", stderr.trim()));
    }

    if !is_binary_elevated(&canonical) {
        return Err("elevation command ran but binary is still not root SUID".to_string());
    }

    log::info!("macos-elevation: successfully elevated {:?}", canonical);
    Ok(())
}

/// Fallback for non-macOS platforms.
#[cfg(not(target_os = "macos"))]
pub async fn ensure_binary_elevated(_path: &Path) -> Result<(), String> {
    Ok(())
}

/// Check if the generated configuration file contains a TUN interface inbound.
pub fn config_requires_tun(config_path: &Path) -> bool {
    if let Ok(content) = std::fs::read_to_string(config_path) {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(inbounds) = val.get("inbounds").and_then(|v| v.as_array()) {
                return inbounds.iter().any(|ib| {
                    ib.get("type").and_then(|t| t.as_str()) == Some("tun")
                });
            }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_config_requires_tun_detection() {
        let temp_dir = std::env::temp_dir();
        let tun_cfg = temp_dir.join("test_tun_detect.json");
        let proxy_cfg = temp_dir.join("test_proxy_detect.json");

        let mut f1 = std::fs::File::create(&tun_cfg).unwrap();
        f1.write_all(br#"{"inbounds":[{"type":"tun","interface_name":"utun"}]}"#).unwrap();

        let mut f2 = std::fs::File::create(&proxy_cfg).unwrap();
        f2.write_all(br#"{"inbounds":[{"type":"mixed","listen_port":2080}]}"#).unwrap();

        assert!(config_requires_tun(&tun_cfg));
        assert!(!config_requires_tun(&proxy_cfg));

        let _ = std::fs::remove_file(tun_cfg);
        let _ = std::fs::remove_file(proxy_cfg);
    }

    #[test]
    fn test_is_binary_elevated_non_macos_default() {
        #[cfg(not(target_os = "macos"))]
        {
            let path = Path::new("/dummy/path");
            assert!(is_binary_elevated(path));
        }
    }
}
