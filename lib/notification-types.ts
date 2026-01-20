/**
 * 通知タイプの定義
 */
export type NotificationType =
  | "hunger" // 空腹通知（既存）
  | "daily_reminder" // 定期リマインダー
  | "random_prompt" // ランダム投稿促進
  | "achievement"; // 達成通知

/**
 * 通知設定の型
 */
export interface NotificationSettings {
  hunger_enabled: boolean; // 空腹通知の有効/無効
  daily_reminder_enabled: boolean; // 定期リマインダーの有効/無効
  daily_reminder_time: string; // 通知時刻 (HH:mm形式、例: "09:00")
  random_prompt_enabled: boolean; // ランダム通知の有効/無効
  achievement_enabled: boolean; // 達成通知の有効/無効
}

/**
 * 通知ペイロードの型
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>; // 追加データ（URLなど）
}

/**
 * 達成タイプの定義
 */
export type AchievementType =
  | "first_memory" // 初投稿
  | "streak_3" // 3日連続
  | "streak_7" // 7日連続
  | "streak_30" // 30日連続
  | "memory_count_10" // 10投稿達成
  | "memory_count_50" // 50投稿達成
  | "memory_count_100"; // 100投稿達成

/**
 * 達成通知のメッセージを生成
 */
export function getAchievementMessage(type: AchievementType): {
  title: string;
  body: string;
} {
  switch (type) {
    case "first_memory":
      return {
        title: "🎉 初めての思い出！",
        body: "おめでとうございます！最初の思い出を記録しました。",
      };
    case "streak_3":
      return {
        title: "🔥 3日連続投稿達成！",
        body: "素晴らしい！3日連続で思い出を記録しています。",
      };
    case "streak_7":
      return {
        title: "🔥 1週間連続投稿達成！",
        body: "すごい！7日連続で思い出を記録し続けています。",
      };
    case "streak_30":
      return {
        title: "🏆 30日連続投稿達成！",
        body: "驚異的！1ヶ月連続で思い出を記録しています。",
      };
    case "memory_count_10":
      return {
        title: "🎯 10個の思い出達成！",
        body: "10個の思い出を記録しました。素敵なコレクションですね！",
      };
    case "memory_count_50":
      return {
        title: "⭐ 50個の思い出達成！",
        body: "50個もの思い出を記録しました。素晴らしい！",
      };
    case "memory_count_100":
      return {
        title: "👑 100個の思い出達成！",
        body: "100個の思い出を記録！あなたは思い出マスターです！",
      };
    default:
      return {
        title: "🎉 達成おめでとう！",
        body: "新しい目標を達成しました！",
      };
  }
}

/**
 * ランダム通知のメッセージ候補
 */
export const RANDOM_PROMPT_MESSAGES = [
  {
    title: "📸 今日の一枚",
    body: "今日はどんな思い出を残しますか？",
  },
  {
    title: "✨ 思い出タイム",
    body: "バクが新しい思い出を待っています！",
  },
  {
    title: "🌟 今日の出来事",
    body: "今日あった素敵なことを記録しませんか？",
  },
  {
    title: "💭 ふりかえり",
    body: "今日1日をふりかえって、思い出を残しましょう。",
  },
  {
    title: "🎨 思い出づくり",
    body: "カメラを向けて、今この瞬間を記録しませんか？",
  },
];

/**
 * ランダム通知メッセージを取得
 */
export function getRandomPromptMessage(): { title: string; body: string } {
  const index = Math.floor(Math.random() * RANDOM_PROMPT_MESSAGES.length);
  return RANDOM_PROMPT_MESSAGES[index];
}
