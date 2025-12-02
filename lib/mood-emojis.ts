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
  defaultScore: number; // APIが応答しない場合のデフォルトスコア (0-100)
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    emoji: "/laugh.png",
    label: "嬉しい",
    category: "positive",
    defaultScore: 80,
  },
  {
    emoji: "/heart.png",
    label: "愛してる",
    category: "positive",
    defaultScore: 90,
  },
  { emoji: "/like.png", label: "いいね", category: "calm", defaultScore: 70 },
  {
    emoji: "/fire.png",
    label: "燃える",
    category: "positive",
    defaultScore: 70,
  },
  {
    emoji: "/sad.png",
    label: "悲しい",
    category: "negative",
    defaultScore: 30,
  },
  { emoji: "/sweat.png", label: "疲れた", category: "tired", defaultScore: 40 },
  {
    emoji: "/Angry_Flat_Icon.png",
    label: "怒り",
    category: "negative",
    defaultScore: 20,
  },
  {
    emoji: "/shocked.png",
    label: "驚き",
    category: "neutral",
    defaultScore: 55,
  },
];
