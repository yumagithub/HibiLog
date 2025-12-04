"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// VAPIDキーを設定
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
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

  // upsert: 既存のレコードがあれば更新、なければ挿入
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(subscriptionData, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to save subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * ユーザーのプッシュ通知購読を解除します。
 * @param userId ユーザーID
 */
export async function unsubscribeUser(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId);

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
  payload: { title: string; body: string; icon?: string }
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
    } catch (err) {
      console.error("Failed to send to device:", err);
      // エラーは無視して次のデバイスへ
    }
  }

  if (successCount > 0) {
    return { success: true };
  } else {
    return { success: false, error: "Failed to send notification to all devices" };
  }
}
