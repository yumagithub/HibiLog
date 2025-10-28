// lib/mood-emojis.ts
export type MoodCategory =
  | "positive"
  | "calm"
  | "neutral"
  | "negative"
  | "tired";

export interface MoodOption {
  emoji: string;
  label: string;
  category: MoodCategory;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: "😊", label: "嬉しい", category: "positive" },
  { emoji: "😆", label: "楽しい", category: "positive" },
  { emoji: "😌", label: "穏やか", category: "calm" },
  { emoji: "🤔", label: "考え中", category: "neutral" },
  { emoji: "😢", label: "悲しい", category: "negative" },
  { emoji: "😭", label: "号泣", category: "negative" },
  { emoji: "😡", label: "怒り", category: "negative" },
  { emoji: "😴", label: "疲れた", category: "tired" },
];
