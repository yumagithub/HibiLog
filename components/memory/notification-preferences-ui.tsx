"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { NotificationPreferences } from "@/lib/notification-preferences";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/notification-preferences";
import {
  Bell,
  Clock,
  Sparkles,
  Trophy,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPreferencesUIProps {
  user: User;
}

const hungerIntervals = [
  { value: 3, label: "3時間", description: "頻繁に通知" },
  { value: 6, label: "6時間", description: "おすすめ" },
  { value: 12, label: "12時間", description: "控えめ" },
  { value: 24, label: "24時間", description: "1日1回まで" },
];

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function NotificationPreferencesUI({
  user,
}: NotificationPreferencesUIProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [hungerInterval, setHungerInterval] = useState(6);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 初期データをDBから読み込み
  useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("baku_profiles")
        .select(
          `
          hunger_notifications_enabled,
          notification_interval,
          daily_reminder_enabled,
          daily_reminder_time,
          random_prompt_enabled,
          achievement_enabled
        `,
        )
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setPrefs({
          hunger: profile.hunger_notifications_enabled ?? true,
          dailyReminder: profile.daily_reminder_enabled ?? false,
          dailyReminderTime: profile.daily_reminder_time ?? "09:00",
          randomPrompt: profile.random_prompt_enabled ?? false,
          achievement: profile.achievement_enabled ?? true,
        });
        setHungerInterval(profile.notification_interval ?? 6);
      }
    }

    loadPreferences();
  }, [user.id]);

  // 設定保存
  const savePreferences = async (
    updates: Partial<
      NotificationPreferences & { notificationInterval?: number }
    >,
  ) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const newPrefs = { ...prefs };

      const dbUpdate: Record<string, unknown> = {};

      if (updates.hunger !== undefined) {
        newPrefs.hunger = updates.hunger;
        dbUpdate.hunger_notifications_enabled = updates.hunger;
      }
      if (updates.dailyReminder !== undefined) {
        newPrefs.dailyReminder = updates.dailyReminder;
        dbUpdate.daily_reminder_enabled = updates.dailyReminder;
      }
      if (updates.dailyReminderTime !== undefined) {
        newPrefs.dailyReminderTime = updates.dailyReminderTime;
        dbUpdate.daily_reminder_time = updates.dailyReminderTime;
      }
      if (updates.randomPrompt !== undefined) {
        newPrefs.randomPrompt = updates.randomPrompt;
        dbUpdate.random_prompt_enabled = updates.randomPrompt;
      }
      if (updates.achievement !== undefined) {
        newPrefs.achievement = updates.achievement;
        dbUpdate.achievement_enabled = updates.achievement;
      }
      if (updates.notificationInterval !== undefined) {
        setHungerInterval(updates.notificationInterval);
        dbUpdate.notification_interval = updates.notificationInterval;
      }

      const { error } = await supabase
        .from("baku_profiles")
        .update(dbUpdate)
        .eq("user_id", user.id);

      if (error) throw error;

      setPrefs(newPrefs);
      setMessage("保存しました");
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setMessage("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-2">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium text-sm">通知設定</span>
        </div>
        {message && (
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              message.includes("失敗")
                ? "bg-destructive/10 text-destructive"
                : "bg-green-100 text-green-700",
            )}
          >
            {message}
          </span>
        )}
      </div>

      {/* 空腹通知セクション */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("hunger")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">空腹通知</div>
              <div className="text-xs text-muted-foreground">
                バクがお腹を空かせたら通知
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={prefs.hunger}
              onCheckedChange={(checked) => {
                savePreferences({ hunger: checked });
              }}
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
            />
            {expandedSection === "hunger" ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* 空腹通知の詳細設定 */}
        {expandedSection === "hunger" && prefs.hunger && (
          <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-3 block">
              通知の最小間隔（連続通知を防ぐ）
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {hungerIntervals.map((interval) => {
                const isSelected = hungerInterval === interval.value;
                return (
                  <button
                    key={interval.value}
                    onClick={() =>
                      savePreferences({ notificationInterval: interval.value })
                    }
                    disabled={isSaving}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {interval.label}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {interval.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 定期リマインダーセクション */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("daily")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">定期リマインダー</div>
              <div className="text-xs text-muted-foreground">
                毎日決まった時刻に通知
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={prefs.dailyReminder}
              onCheckedChange={(checked) =>
                savePreferences({ dailyReminder: checked })
              }
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
            />
            {expandedSection === "daily" ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* 定期リマインダーの詳細設定 */}
        {expandedSection === "daily" && prefs.dailyReminder && (
          <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-2 block">
              通知時刻
            </Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={prefs.dailyReminderTime}
              onChange={(e) =>
                savePreferences({ dailyReminderTime: e.target.value })
              }
              disabled={isSaving}
            >
              {timeOptions.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ランダム通知セクション */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">ランダム通知</div>
              <div className="text-xs text-muted-foreground">
                1日1回、ランダムな時間に投稿を促す
              </div>
            </div>
          </div>
          <Switch
            checked={prefs.randomPrompt}
            onCheckedChange={(checked) =>
              savePreferences({ randomPrompt: checked })
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* 達成通知セクション */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100">
              <Trophy className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">達成通知</div>
              <div className="text-xs text-muted-foreground">
                連続投稿記録などの達成時に通知
              </div>
            </div>
          </div>
          <Switch
            checked={prefs.achievement}
            onCheckedChange={(checked) =>
              savePreferences({ achievement: checked })
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* 説明文 */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground text-center">
          通知はいつでもオフにできます
        </p>
      </div>
    </div>
  );
}
