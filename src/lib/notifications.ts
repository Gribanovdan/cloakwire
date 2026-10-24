import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export const NOTIFICATIONS_STORAGE_KEY = "cloakwire.notifications.enabled";

export function areNotificationsEnabled(): boolean {
  try {
    const val = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setNotificationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(enabled));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Proactively request OS or browser notification permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    return granted;
  } catch {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") return true;
        if (Notification.permission !== "denied") {
          const perm = await Notification.requestPermission();
          return perm === "granted";
        }
      }
    } catch {
      // ignore
    }
    return false;
  }
}

/**
 * Send a native desktop notification if user has enabled notifications
 * and OS permissions are granted.
 */
export async function notify(title: string, body: string): Promise<boolean> {
  if (!areNotificationsEnabled()) {
    return false;
  }

  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }

    if (granted) {
      sendNotification({ title, body });
      return true;
    }
  } catch (err) {
    // Fallback to web Notification API if running in WebView/browser
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
          return true;
        } else if (Notification.permission !== "denied") {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            new Notification(title, { body });
            return true;
          }
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }

  return false;
}
