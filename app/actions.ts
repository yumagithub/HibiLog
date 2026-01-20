"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import {
  getAchievementMessage,
  type AchievementType,
} from "@/lib/notification-types";

// VAPIDキーを設定
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

/**
 * ユーザーのプッシュ通知購読を保存します。
 * @param sub PushSubscriptionオブジェクト
 * @param userId ユーザーID
 */
export async function subscribeUser(sub: PushSubscriptionJSON, userId: string) {
  const supabase = await createClient();

  // サブスクリプションデータを準備
  const subscriptionData = {
    user_id: userId,
    endpoint: sub.endpoint || "",
    p256dh: sub.keys?.p256dh || "",
    auth: sub.keys?.auth || "",
  };

  // upsert: endpointをキーにして、同じデバイスの購読情報を更新
  // 複数デバイス対応: 異なるendpointは別レコードとして保存される
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(subscriptionData, { onConflict: "endpoint" });

  if (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 特定デバイスのプッシュ通知購読を解除します。
 * @param endpoint 削除する購読のendpoint
 */
export async function unsubscribeUser(endpoint: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Failed to delete subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 特定のユーザーにプッシュ通知を送信します。
 * @param userId 通知を送信するユーザーのID
 * @param payload 通知の内容
 */
export async function sendNotification(
  userId: string,
  payload: { title: string; body: string; icon?: string },
) {
  const supabase = await createClient();

  // データベースからユーザーの全購読情報を取得（複数デバイス対応）
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    return { success: false, error: "Subscription not found" };
  }

  // 全デバイスに通知を送信
  let successCount = 0;
  const failedEndpoints: string[] = []; // 失効した購読のendpoint

  for (const subscriptionData of data) {
    const subscription: webpush.PushSubscription = {
      endpoint: subscriptionData.endpoint,
      keys: {
        p256dh: subscriptionData.p256dh,
        auth: subscriptionData.auth,
      },
    };

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      successCount++;
    } catch (err: any) {
      console.error("Failed to send to device:", err);

      // 410 Gone（購読終了）、404 Not Found（無効）、403 Forbidden（認証失敗・Safari APNs）の場合、DBから削除
      if (
        err.statusCode === 410 ||
        err.statusCode === 404 ||
        err.statusCode === 403
      ) {
        console.log(
          `[sendNotification] Removing expired/invalid subscription: ${subscriptionData.endpoint}`,
        );
        failedEndpoints.push(subscriptionData.endpoint);
      }
      // その他のエラーは無視して次のデバイスへ
    }
  }

  // 失効した購読をDBから削除
  if (failedEndpoints.length > 0) {
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", failedEndpoints);

    if (deleteError) {
      console.error(
        "[sendNotification] Failed to clean up expired subscriptions:",
        deleteError,
      );
    } else {
      console.log(
        `[sendNotification] Cleaned up ${failedEndpoints.length} expired subscriptions`,
      );
    }
  }

  if (successCount > 0) {
    return { success: true };
  } else {
    return {
      success: false,
      error: "Failed to send notification to all devices",
    };
  }
}

/**
 * 達成通知をチェックして送信
 * メモリー投稿時に呼び出される
 */
export async function checkAndSendAchievementNotification(userId: string) {
  console.log("[checkAndSendAchievementNotification] Start for user:", userId);
  const supabase = await createClient();

  // ユーザーの達成通知設定を確認
  const { data: profile, error: profileError } = await supabase
    .from("baku_profiles")
    .select("achievement_enabled, last_achievement_sent")
    .eq("user_id", userId)
    .single();

  console.log("[checkAndSendAchievementNotification] Profile:", profile);
  console.log(
    "[checkAndSendAchievementNotification] Profile error:",
    profileError,
  );

  if (!profile || !profile.achievement_enabled) {
    console.log(
      "[checkAndSendAchievementNotification] Achievement notifications disabled",
    );
    return { success: false, error: "Achievement notifications disabled" };
  }

  const sentAchievements: string[] = profile.last_achievement_sent || [];
  console.log(
    "[checkAndSendAchievementNotification] Already sent:",
    sentAchievements,
  );

  // メモリー総数を取得
  const { count: memoryCount } = await supabase
    .from("memories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  console.log(
    "[checkAndSendAchievementNotification] Memory count:",
    memoryCount,
  );

  // 連続投稿日数を計算（簡易版：詳細はstreak-calculatorを使用）
  const { data: recentMemories } = await supabase
    .from("memories")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  let currentStreak = 0;
  if (recentMemories && recentMemories.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    for (const memory of recentMemories) {
      const memoryDate = new Date(memory.created_at);
      memoryDate.setHours(0, 0, 0, 0);

      if (memoryDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  console.log(
    "[checkAndSendAchievementNotification] Current streak:",
    currentStreak,
  );

  // チェックする達成条件
  const achievementsToCheck: { type: AchievementType; condition: boolean }[] = [
    { type: "first_memory", condition: memoryCount === 1 },
    { type: "streak_3", condition: currentStreak === 3 },
    { type: "streak_7", condition: currentStreak === 7 },
    { type: "streak_30", condition: currentStreak === 30 },
    { type: "memory_count_10", condition: memoryCount === 10 },
    { type: "memory_count_50", condition: memoryCount === 50 },
    { type: "memory_count_100", condition: memoryCount === 100 },
  ];

  console.log(
    "[checkAndSendAchievementNotification] Achievements to check:",
    achievementsToCheck,
  );

  // 達成した未送信の通知を見つける
  const newAchievements = achievementsToCheck
    .filter((a) => a.condition && !sentAchievements.includes(a.type))
    .map((a) => a.type);

  console.log(
    "[checkAndSendAchievementNotification] New achievements:",
    newAchievements,
  );

  if (newAchievements.length === 0) {
    console.log("[checkAndSendAchievementNotification] No new achievements");
    return { success: true, message: "No new achievements" };
  }

  // 最初の達成のみ送信（複数同時達成の場合）
  const achievementType = newAchievements[0];
  const message = getAchievementMessage(achievementType);

  console.log(
    "[checkAndSendAchievementNotification] Sending:",
    achievementType,
    message,
  );

  // 通知送信
  const result = await sendNotification(userId, {
    title: message.title,
    body: message.body,
    icon: "/icon-192x192.png",
  });

  console.log("[checkAndSendAchievementNotification] Send result:", result);

  if (result.success) {
    // 送信済みリストを更新
    await supabase
      .from("baku_profiles")
      .update({
        last_achievement_sent: [...sentAchievements, achievementType],
      })
      .eq("user_id", userId);

    console.log("[checkAndSendAchievementNotification] Updated sent list");
    return { success: true, achievement: achievementType };
  }

  return result;
}
