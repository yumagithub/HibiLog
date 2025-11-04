// ストリーク計算ユーティリティ

/**
 * 投稿日付の配列からストリーク情報を計算
 * @param memoryDates - YYYY-MM-DD形式の日付配列（降順でソート済みを想定）
 * @returns { currentStreak: number, longestStreak: number }
 */
export function calculateStreaks(memoryDates: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (memoryDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 日付を昇順でソート（古い順）
  const sortedDates = [...new Set(memoryDates)].sort();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split("T")[0];

  // 最後の投稿日
  const lastPostDate = sortedDates[sortedDates.length - 1];
  const lastPost = new Date(lastPostDate);
  lastPost.setHours(0, 0, 0, 0);

  // 今日または昨日の投稿がない場合、現在のストリークは0
  const daysSinceLastPost = Math.floor(
    (today.getTime() - lastPost.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 現在のストリークを計算（最新の投稿から逆順にチェック）
  if (daysSinceLastPost <= 1) {
    // 今日または昨日に投稿がある場合
    currentStreak = 1;

    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i + 1]);
      const previousDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // 最長ストリークを計算（全期間をスキャン）
  tempStreak = 1;
  longestStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const previousDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    previousDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}
