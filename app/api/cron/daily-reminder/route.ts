import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// VAPIDキーを設定 (既存のhunger-checkから流用)
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

export async function POST(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Cronジョブ用の認証チェック
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // VercelサーバーはUTCのため、JSTの現在時刻を取得 (UTC+9時間)
    const now = new Date();
    now.setHours(now.getUTCHours() + 9);
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentTime = `${currentHour}:00`;

    console.log(`[daily-reminder] Running for time: ${currentTime} (JST)`);

    // リマインダーが有効で、指定時刻のユーザーを取得
    const { data: profiles, error: profilesError } = await supabase
      .from("baku_profiles")
      .select("user_id")
      .eq("daily_reminder_enabled", true)
      .eq("daily_reminder_time", currentTime);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: `No users to notify for ${currentTime}`,
      });
    }

    console.log(`[daily-reminder] Found ${profiles.length} users for ${currentTime}`);

    // 通知ペイロード
    const payload = JSON.stringify({
      title: "📅 今日の思い出",
      body: "今日も素敵な1日を記録しましょう！",
      icon: "/icon-192x192.png",
    });

    let successCount = 0;
    const invalidEndpoints: string[] = [];

    // 各ユーザーに通知を送信
    for (const profile of profiles) {
      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", profile.user_id);

      if (subError || !subscriptions || subscriptions.length === 0) {
        continue;
      }

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload
          );
          successCount++;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            invalidEndpoints.push(subscription.endpoint);
          } else {
            console.error(
              `[daily-reminder] Failed to send to user ${profile.user_id}:`,
              error
            );
          }
        }
      }
    }

    // 無効な購読情報をDBから削除
    if (invalidEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", invalidEndpoints);
      console.log(
        `[daily-reminder] Removed ${invalidEndpoints.length} invalid subscription(s).`
      );
    }

    return NextResponse.json({
      message: "Daily reminders process complete.",
      time: currentTime,
      totalUsers: profiles.length,
      successCount,
    });
  } catch (error: any) {
    console.error("[daily-reminder] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
