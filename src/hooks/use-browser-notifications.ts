"use client";

import { useState, useEffect, useCallback } from "react";
import { playNotificationChime, SoundTheme } from "@/lib/notifications/sound";

export interface BrowserNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  link?: string;
  soundEnabled?: boolean;
  soundTheme?: SoundTheme;
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return "denied";
    }
  }, []);

  const notify = useCallback(
    (title: string, options?: BrowserNotificationOptions) => {
      // Play sound if requested
      if (options?.soundEnabled !== false) {
        playNotificationChime(options?.soundTheme || "subtle");
      }

      // Check browser notification permission
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body: options?.body,
            icon: options?.icon || "/favicon.ico",
            tag: options?.tag,
          });

          if (options?.link) {
            notification.onclick = () => {
              window.focus();
              window.location.href = options.link!;
            };
          }
        } catch (err) {
          console.warn("Failed to trigger browser notification:", err);
        }
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
  };
}
