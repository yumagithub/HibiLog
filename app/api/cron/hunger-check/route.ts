import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// VAPIDキーを設定
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const adminEmail = process.env.ADMIN_EMAIL || "admin@hibilog.app";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${adminEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

const HUNGER_THRESHOLD = 25;
const HUNGER_DECREASE_RATE = 40 / 24; // 1時間あたり約1.67%

export async function POST(request: NextRequest) {
  try {
    // Service Role Keyで全データにアクセス
    const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 認証チェック（Cron用のシークレットトークン）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 全てのバクのプロフィールを取得
    const { data: profiles, error: profilesError } = await supabase
      .from("baku_profiles")
      .select(
        "user_id, hunger_level, last_fed_at, notification_interval, last_notification_sent_at"
      );

    if (profilesError) {
      throw profilesError;
    }

    let updatedCount = 0;
    let notificationsSent = 0;

    for (const profile of profiles || []) {
      const now = Date.now();
      const lastFedTime = new Date(profile.last_fed_at).getTime();
      const hoursSinceLastFed = (now - lastFedTime) / (1000 * 60 * 60);

      // 空腹度を計算: last_fed_at時点で100%、そこから時間経過で減少
      const hungerDecrease = hoursSinceLastFed * HUNGER_DECREASE_RATE;
      const calculatedHunger = Math.max(0, 100 - hungerDecrease);

      // 空腹度を更新（計算値とDB値が異なる場合）
      if (Math.abs(calculatedHunger - profile.hunger_level) > 0.1) {
        const { error: updateError } = await supabase
          .from("baku_profiles")
          .update({ hunger_level: calculatedHunger })
          .eq("user_id", profile.user_id);

        if (!updateError) {
          updatedCount++;
        }
      }

      // 通知が必要か判断: 空腹度が閾値以下の場合
      if (calculatedHunger <= HUNGER_THRESHOLD) {
        // ユーザーの通知間隔設定を確認
        const notificationInterval = profile.notification_interval || 6; // デフォルト6時間
        const lastNotificationTime = profile.last_notification_sent_at
          ? new Date(profile.last_notification_sent_at).getTime()
          : 0;
        const hoursSinceLastNotification =
          (now - lastNotificationTime) / (1000 * 60 * 60);

        // 設定された間隔が経過していない場合はスキップ
        if (
          lastNotificationTime > 0 &&
          hoursSinceLastNotification < notificationInterval
        ) {
          continue;
        }

        // Push購読情報を取得（複数デバイス対応）
        const { data: subscriptions, error: subError } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", profile.user_id);

        if (subError) {
          console.error(
            `Subscription query error for user ${profile.user_id}:`,
            subError
          );
          continue;
        }

        // 全てのデバイスに通知を送信
        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: "バクがお腹を空かせています！",
            body: "思い出を投稿してバクに食べさせてあげましょう。",
            icon: "/icon-192x192.png",
          });

          let deviceNotificationsSent = 0;
          const invalidEndpoints: string[] = [];

          // 各デバイスに通知を送信
          for (const subscription of subscriptions) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                payload
              );
              deviceNotificationsSent++;
            } catch (error: any) {
              // 410 Gone or 404: 購読が無効
              if (error.statusCode === 410 || error.statusCode === 404) {
                invalidEndpoints.push(subscription.endpoint);
                console.log(
                  `Invalid subscription endpoint: ${subscription.endpoint.substring(
                    0,
                    50
                  )}...`
                );
              } else {
                console.error(
                  `Failed to send notification to endpoint ${subscription.endpoint.substring(
                    0,
                    50
                  )}...:`,
                  error
                );
              }
            }
          }

          // 無効な購読を削除
          if (invalidEndpoints.length > 0) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .in("endpoint", invalidEndpoints);
            console.log(
              `Removed ${invalidEndpoints.length} invalid subscription(s) for user ${profile.user_id}`
            );
          }

          // 1台以上のデバイスに送信成功した場合
          if (deviceNotificationsSent > 0) {
            // 通知送信時刻を記録
            await supabase
              .from("baku_profiles")
              .update({ last_notification_sent_at: new Date().toISOString() })
              .eq("user_id", profile.user_id);

            notificationsSent += deviceNotificationsSent;
            console.log(
              `Notification sent to user ${profile.user_id} on ${deviceNotificationsSent} device(s)`
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      notificationsSent,
      message: `Hunger check complete: ${updatedCount} profiles updated, ${notificationsSent} notifications sent.`,
    });
  } catch (error: any) {
    console.error("Hunger check error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
