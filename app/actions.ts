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

  // データベースからユーザーの購読情報を取得
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { success: false, error: "Subscription not found" };
  }

  // PushSubscriptionオブジェクトを再構築
  const subscription: webpush.PushSubscription = {
    endpoint: data.endpoint,
    keys: {
      p256dh: data.p256dh,
      auth: data.auth,
    },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    // 購読が無効または期限切れの場合(410 Gone)、購読情報を削除します。
    if (
      error instanceof webpush.WebPushError &&
      (error.statusCode === 410 || error.statusCode === 404)
    ) {
      await unsubscribeUser(userId);
    }
    return { success: false, error: "Failed to send notification" };
  }
}
