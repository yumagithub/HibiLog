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
  { emoji: "/laugh.png", label: "嬉しい", category: "positive" },
  { emoji: "/heart.png", label: "愛してる", category: "positive" },
  { emoji: "/like.png", label: "いいね", category: "calm" },
  { emoji: "/fire.png", label: "燃える", category: "positive" },
  { emoji: "/sad.png", label: "悲しい", category: "negative" },
  { emoji: "/sweat.png", label: "疲れた", category: "tired" },
  { emoji: "/Angry_Flat_Icon.png", label: "怒り", category: "negative" },
  { emoji: "/shocked.png", label: "驚き", category: "neutral" },
];
