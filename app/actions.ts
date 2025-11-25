"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// VAPIDキーを設定
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const TABLE_NAME = "push_subscriptions";

/**
 * ユーザーのプッシュ通知購読を保存します。
 * @param sub PushSubscriptionオブジェクト
 * @param userId ユーザーID
 */
export async function subscribeUser(sub: PushSubscriptionJSON, userId: string) {
  const supabase = await createClient();

  const endpoint = sub.endpoint ?? "";
  if (!endpoint) return { success: false, error: "Invalid endpoint" };

  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      user_id: userId,
      endpoint: endpoint,
      subscription: sub,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Failed to save subscription", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * ユーザーのプッシュ通知購読を解除します。
 * @param userId ユーザーID
 */
export async function unsubscribeUser(endpoint: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Failed to delete subscription", error);
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

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("subscription")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    console.error("Subscription not found", error);
    return { success: false, error: "Subscription not found" };
  }

  const notificationPromises = data.map(async (row) => {
    const subscription = row.subscription as webpush.PushSubscription;

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      // 購読が無効または期限切れの場合(410 Gone)、購読情報を削除します。
      if (
        error instanceof webpush.WebPushError &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        console.warn(`Stale subscription deleted: ${subscription.endpoint}`);
        await supabase
          .from(TABLE_NAME)
          .delete()
          .eq("endpoint", subscription.endpoint);
      }
      return { success: false, error: "Push failed" };
    }
  });

  await Promise.allSettled(notificationPromises);

  return {
    success: true,
    message: `Attempted to send ${data.length} notifications.`,
  };
}
