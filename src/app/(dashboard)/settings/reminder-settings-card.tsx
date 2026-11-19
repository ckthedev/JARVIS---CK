"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Volume2,
  Clock,
  Globe,
  ShieldAlert,
  Play,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { playNotificationChime, SoundTheme } from "@/lib/notifications/sound";

export function ReminderSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTheme, setSoundTheme] = useState<SoundTheme>("subtle");
  const [defaultSnoozeMinutes, setDefaultSnoozeMinutes] = useState(10);
  const [missedReminderPolicy, setMissedReminderPolicy] = useState("NOTIFY_IMMEDIATELY");
  const [notificationBrowser, setNotificationBrowser] = useState(true);

  useEffect(() => {
    fetch("/api/user/settings")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ settings?: Record<string, unknown> }>)
          : { settings: undefined }
      )
      .then((data) => {
        if (data.settings) {
          setTimezone((data.settings.timezone as string) || "Asia/Kolkata");
          setSoundEnabled((data.settings.soundEnabled as boolean) ?? true);
          setSoundTheme((data.settings.soundTheme as SoundTheme) || "subtle");
          setDefaultSnoozeMinutes((data.settings.defaultSnoozeMinutes as number) || 10);
          setMissedReminderPolicy(
            (data.settings.missedReminderPolicy as string) || "NOTIFY_IMMEDIATELY"
          );
          setNotificationBrowser((data.settings.notificationBrowser as boolean) ?? true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          soundEnabled,
          soundTheme,
          defaultSnoozeMinutes,
          missedReminderPolicy,
          notificationBrowser,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save reminder settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSound = () => {
    playNotificationChime(soundTheme);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Reminders & Alert Preferences
          </CardTitle>
          <CardDescription>Loading configuration parameters...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          Reminders & Notification Engine
        </CardTitle>
        <CardDescription>
          Audio chime synthesizers, local timezone synchronization, and background offline recovery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Scheduler Timezone
            </span>
            <p className="text-xs text-secondary-text">
              Reference timezone for daily agenda, monthly calendar clamping and recurrence
            </p>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-9 w-52 rounded-xl border border-input bg-card px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-saas"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="UTC">UTC (GMT +0:00)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
          </select>
        </div>

        {/* Sound Toggle & Theme */}
        <div className="space-y-3 border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                Notification Audio Chimes
              </span>
              <p className="text-xs text-secondary-text">
                Synthesized Web Audio melody (100% offline, zero asset dependencies)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? "bg-primary" : "bg-sidebar-accent"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {soundEnabled && (
            <div className="flex items-center justify-between pl-5 pt-1">
              <div className="space-y-0.5">
                <span className="text-xs text-secondary-text">Melodic Tone Theme</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={soundTheme}
                  onChange={(e) => setSoundTheme(e.target.value as SoundTheme)}
                  className="flex h-8 w-36 rounded-xl border border-input bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-saas"
                >
                  <option value="subtle">Subtle Warm</option>
                  <option value="chime">Double Chime</option>
                  <option value="modern">Modern Arpeggio</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestSound}
                  className="h-8 px-2.5 text-xs gap-1 border-border/80 bg-card"
                  title="Test notification sound"
                >
                  <Play className="h-3 w-3 text-primary fill-current" />
                  Test
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Default Snooze */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Default Snooze Duration
            </span>
            <p className="text-xs text-secondary-text">
              Fallback snooze duration when one-click postponement is triggered
            </p>
          </div>
          <select
            value={defaultSnoozeMinutes.toString()}
            onChange={(e) => setDefaultSnoozeMinutes(parseInt(e.target.value, 10))}
            className="flex h-8 w-36 rounded-xl border border-input bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-saas"
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>

        {/* Missed Reminder Policy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              Offline Recovery Behavior
            </span>
            <p className="text-xs text-secondary-text">
              Handling of reminders due while JARVIS service or machine was powered off
            </p>
          </div>
          <select
            value={missedReminderPolicy}
            onChange={(e) => setMissedReminderPolicy(e.target.value)}
            className="flex h-8 w-52 rounded-xl border border-input bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-saas"
          >
            <option value="NOTIFY_IMMEDIATELY">Notify immediately on startup</option>
            <option value="SKIP_OLDER">Skip past occurrences</option>
          </select>
        </div>

        {/* Save button and status */}
        <div className="flex items-center justify-between pt-2">
          {success ? (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Settings updated successfully
            </span>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Alert Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
