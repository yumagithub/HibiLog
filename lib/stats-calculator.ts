// lib/stats-calculator.ts
import type { Memory } from "@/components/memories-tab";

export interface StatsData {
  totalMemories: number;
  currentStreak: number;
  longestStreak: number;
  daysSinceStart: number;
  moodDistribution: {
    [key: string]: number;
  };
  monthlyData: {
    month: string;
    count: number;
  }[];
  weekdayData: {
    day: string;
    dayShort: string;
    count: number;
  }[];
}

/**
 * 統計データを計算する
 */
export function calculateStats(memories: Memory[]): StatsData {
  if (memories.length === 0) {
    return {
      totalMemories: 0,
      currentStreak: 0,
      longestStreak: 0,
      daysSinceStart: 0,
      moodDistribution: {},
      monthlyData: [],
      weekdayData: getEmptyWeekdayData(),
    };
  }

  // 日付でソート（古い順）
  const sortedMemories = [...memories].sort(
    (a, b) =>
      new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
  );

  // 総思い出数
  const totalMemories = memories.length;

  // アプリ利用日数
  const firstDate = new Date(sortedMemories[0].memory_date);
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 連続記録日数を計算
  const { currentStreak, longestStreak } = calculateStreaks(sortedMemories);

  // 感情の分布を計算
  const moodDistribution = calculateMoodDistribution(memories);

  // 月別データを計算
  const monthlyData = calculateMonthlyData(memories);

  // 曜日別データを計算
  const weekdayData = calculateWeekdayData(memories);

  return {
    totalMemories,
    currentStreak,
    longestStreak,
    daysSinceStart,
    moodDistribution,
    monthlyData,
    weekdayData,
  };
}

/**
 * 連続記録日数を計算
 */
function calculateStreaks(sortedMemories: Memory[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (sortedMemories.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 日付のみの配列を作成（重複を削除）
  const uniqueDates = Array.from(
    new Set(sortedMemories.map((m) => m.memory_date))
  ).sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // 最新の日付から遡って連続日数を計算
  let checkDate = new Date(today);
  let foundGap = false;

  for (let i = uniqueDates.length - 1; i >= 0; i--) {
    const memoryDate = uniqueDates[i];
    const memoryDateObj = new Date(memoryDate);
    memoryDateObj.setHours(0, 0, 0, 0);

    if (!foundGap) {
      const diffDays = Math.floor(
        (checkDate.getTime() - memoryDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === 1) {
        currentStreak++;
        checkDate = new Date(memoryDateObj);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        foundGap = true;
      }
    }

    // 最長連続記録を計算
    if (i > 0) {
      const prevDate = new Date(uniqueDates[i - 1]);
      prevDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (memoryDateObj.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * 感情の分布を計算
 */
function calculateMoodDistribution(memories: Memory[]): {
  [key: string]: number;
} {
  const distribution: { [key: string]: number } = {};

  memories.forEach((memory) => {
    const category = memory.mood_category || "unknown";
    distribution[category] = (distribution[category] || 0) + 1;
  });

  return distribution;
}

/**
 * 月別データを計算（過去12ヶ月）
 */
function calculateMonthlyData(
  memories: Memory[]
): { month: string; count: number }[] {
  const monthlyCount: { [key: string]: number } = {};

  // 過去12ヶ月の月を生成
  const today = new Date();
  const months: string[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    months.push(monthKey);
    monthlyCount[monthKey] = 0;
  }

  // 思い出をカウント
  memories.forEach((memory) => {
    const date = new Date(memory.memory_date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    if (monthlyCount[monthKey] !== undefined) {
      monthlyCount[monthKey]++;
    }
  });

  // データを整形
  return months.map((monthKey) => {
    const [year, month] = monthKey.split("-");
    return {
      month: `${parseInt(month)}月`,
      count: monthlyCount[monthKey],
    };
  });
}

/**
 * 曜日別データを計算
 */
function calculateWeekdayData(
  memories: Memory[]
): { day: string; dayShort: string; count: number }[] {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekdayCount: number[] = [0, 0, 0, 0, 0, 0, 0];

  memories.forEach((memory) => {
    const date = new Date(memory.memory_date);
    const dayOfWeek = date.getDay();
    weekdayCount[dayOfWeek]++;
  });

  return weekdays.map((day, index) => ({
    day: `${day}曜日`,
    dayShort: day,
    count: weekdayCount[index],
  }));
}

/**
 * 空の曜日データを返す
 */
function getEmptyWeekdayData(): {
  day: string;
  dayShort: string;
  count: number;
}[] {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays.map((day) => ({
    day: `${day}曜日`,
    dayShort: day,
    count: 0,
  }));
}

/**
 * 感情のカラーマップ
 */
export const MOOD_COLORS: { [key: string]: string } = {
  positive: "#10b981", // green-500 - ポジティブ
  calm: "#3b82f6", // blue-500 - 穏やか
  neutral: "#6b7280", // gray-500 - 中立
  negative: "#ef4444", // red-500 - ネガティブ
  tired: "#f59e0b", // amber-500 - 疲労
  unknown: "#9ca3af", // gray-400 - 不明
};

/**
 * 感情の日本語ラベル
 */
export const MOOD_LABELS: { [key: string]: string } = {
  positive: "ポジティブ",
  calm: "穏やか",
  neutral: "中立",
  negative: "ネガティブ",
  tired: "疲れた",
  unknown: "不明",
};
