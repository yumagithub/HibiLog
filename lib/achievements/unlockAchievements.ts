import { createClient } from "@/lib/supabase/client";

type Achievement = {
  id: string;
  condition_type: string;
  threshold: number | null;
  meta: any;
};

type Stats = {
  totalPosts: number;
  todayPosts: number;
  currentStreak: number;
  postHoursJst: number[];
  prefecturesVisited: Set<string>;
};

export async function unlockAchievementsForUser(userId: string) {
  const supabase = createClient();

  /* ----------------------------------
   * 1. 유저 memories 조회
   * ---------------------------------- */
  const { data: memories, error: memErr } = await supabase
    .from("memories")
    .select("memory_date, created_at, prefecture_code")
    .eq("user_id", userId);

  if (memErr || !memories) {
    console.error("memories 조회 실패:", memErr);
    return;
  }

  /* ----------------------------------
   * 2. Stats 계산
   * ---------------------------------- */
  const todayJst = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });

  const totalPosts = memories.length;

  const todayPosts = memories.filter(
    (m) => m.memory_date === todayJst
  ).length;

  const postHoursJst = memories.map((m) => {
    return Number(
      new Date(m.created_at).toLocaleString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      })
    );
  });

  const prefecturesVisited = new Set(
    memories
      .map((m) => m.prefecture_code)
      .filter(Boolean)
  );

  const currentStreak = calculateCurrentStreak(
    memories.map((m) => m.memory_date)
  );

  const stats: Stats = {
    totalPosts,
    todayPosts,
    currentStreak,
    postHoursJst,
    prefecturesVisited,
  };

  /* ----------------------------------
   * 3. achievements 마스터 로드
   * ---------------------------------- */
  const { data: achievements, error: achErr } = await supabase
    .from("achievements")
    .select("id, condition_type, threshold, meta")
    .eq("is_active", true);

  if (achErr || !achievements) {
    console.error("achievements 조회 실패:", achErr);
    return;
  }

  /* ----------------------------------
   * 4. 이미 달성한 업적 로드
   * ---------------------------------- */
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedSet = new Set(
    (unlocked ?? []).map((u) => u.achievement_id)
  );

  /* ----------------------------------
   * 5. 달성 여부 판정
   * ---------------------------------- */
  const newlyUnlocked: { user_id: string; achievement_id: string }[] = [];

  for (const a of achievements as Achievement[]) {
    if (unlockedSet.has(a.id)) continue;

    let achieved = false;

    switch (a.condition_type) {
      case "total_posts":
        achieved = stats.totalPosts >= (a.threshold ?? 0);
        break;

      case "daily_posts":
        achieved = stats.todayPosts >= (a.threshold ?? 0);
        break;

      case "streak_days":
        achieved = stats.currentStreak >= (a.threshold ?? 0);
        break;

      case "time_window": {
        const { start_hour, end_hour } = a.meta;
        achieved = stats.postHoursJst.some(
          (h) => h >= start_hour && h < end_hour
        );
        break;
      }

      case "prefecture_once": {
        const pref = a.meta?.prefecture;
        achieved = pref && stats.prefecturesVisited.has(pref);
        break;
      }
    }

    if (achieved) {
      newlyUnlocked.push({
        user_id: userId,
        achievement_id: a.id,
      });
    }
  }

  /* ----------------------------------
   * 6. user_achievements 저장
   * ---------------------------------- */
  if (newlyUnlocked.length > 0) {
    const { error } = await supabase
      .from("user_achievements")
      .insert(newlyUnlocked);

    if (error) {
      console.error("업적 저장 실패:", error);
    }
  }

  return newlyUnlocked;
}
