/**
 * 通知設定のストア拡張
 */
export interface NotificationPreferences {
  hunger: boolean; // 空腹通知
  dailyReminder: boolean; // 定期リマインダー
  dailyReminderTime: string; // "09:00" 形式
  randomPrompt: boolean; // ランダム通知
  achievement: boolean; // 達成通知
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  hunger: true,
  dailyReminder: false,
  dailyReminderTime: "09:00",
  randomPrompt: false,
  achievement: true,
};
