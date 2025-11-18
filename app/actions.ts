"use server";

import webpush from "web-push";

// VAPIDキーを設定
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// 本番環境ではデータベースに保存することを強く推奨します。
// この例では、サーバーのメモリ上に一時的に購読情報を保持します。
let subscriptions = new Map<string, PushSubscriptionJSON>();

/**
 * ユーザーのプッシュ通知購読を保存します。
 * @param sub PushSubscriptionオブジェクト
 * @param userId ユーザーID
 */
export async function subscribeUser(sub: PushSubscriptionJSON, userId: string) {
  // TODO: 本番環境では、この情報をデータベースに永続化してください。
  // 例: await db.subscriptions.create({ userId, subscription: sub });
  subscriptions.set(userId, sub);
  return { success: true };
}

/**
 * ユーザーのプッシュ通知購読を解除します。
 * @param userId ユーザーID
 */
export async function unsubscribeUser(userId: string) {
  // TODO: 本番環境では、データベースから対応する購読情報を削除してください。
  // 例: await db.subscriptions.delete({ where: { userId } });
  subscriptions.delete(userId);
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
  // TODO: 本番環境では、データベースからユーザーの購読情報を取得してください。
  // const sub = await db.subscriptions.findUnique({ where: { userId } });
  const sub = subscriptions.get(userId);

  if (!sub) {
    return { success: false, error: "Subscription not found" };
  }

  try {
    await webpush.sendNotification(
      sub as webpush.PushSubscription,
      JSON.stringify(payload)
    );
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
