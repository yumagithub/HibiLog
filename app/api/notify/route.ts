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
    vapidPrivateKey,
  );
}

// POST /api/notify
// Body: { userId: string, payload: { title: string; body: string; icon?: string } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, payload } = body || {};

    if (!userId || !payload?.title || !payload?.body) {
      return NextResponse.json(
        {
          success: false,
          error: "userId and payload(title, body) are required",
        },
        { status: 400 },
      );
    }

    // Service Role Key で RLS をバイパス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // データベースからユーザーの全購読情報を取得（複数デバイス対応）
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 },
      );
    }

    // 全デバイスに通知を送信
    let successCount = 0;
    const failedEndpoints: string[] = [];

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

        // 410 Gone, 404 Not Found, 403 Forbidden の場合、DBから削除
        if (
          err.statusCode === 410 ||
          err.statusCode === 404 ||
          err.statusCode === 403
        ) {
          failedEndpoints.push(subscriptionData.endpoint);
        }
      }
    }

    // 無効な購読を削除
    if (failedEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints);
      console.log(`Removed ${failedEndpoints.length} invalid subscription(s)`);
    }

    if (successCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to send to any device" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, sentTo: successCount });
  } catch (error: any) {
    console.error("/api/notify error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
