import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * バックグラウンド通知システムの診断ツール
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Service Role Keyを使って全データにアクセス
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. あなたのプロフィールを取得
    const { data: yourProfile } = await supabase
      .from("baku_profiles")
      .select(
        "user_id, hunger_level, last_fed_at, notification_interval, last_notification_sent_at"
      )
      .eq("user_id", "85526f29-e444-44c3-a132-9f6f766ded51")
      .single();

    // 2. あなたの購読情報を取得
    const { data: yourSubscription, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint")
      .eq("user_id", "85526f29-e444-44c3-a132-9f6f766ded51")
      .single();

    console.log("Subscription query result:", {
      data: yourSubscription,
      error: subError,
    });

    // 3. 通知が送られるべきか判定
    const HUNGER_THRESHOLD = 25;
    const shouldNotify =
      yourProfile && yourProfile.hunger_level <= HUNGER_THRESHOLD;

    const now = Date.now();
    const lastNotificationTime = yourProfile?.last_notification_sent_at
      ? new Date(yourProfile.last_notification_sent_at).getTime()
      : 0;
    const hoursSinceLastNotification =
      lastNotificationTime > 0
        ? (now - lastNotificationTime) / (1000 * 60 * 60)
        : 999;

    const notificationInterval = yourProfile?.notification_interval || 6;
    const intervalPassed = hoursSinceLastNotification >= notificationInterval;

    return NextResponse.json({
      step1_profile: {
        exists: !!yourProfile,
        hunger_level: yourProfile?.hunger_level,
        last_fed_at: yourProfile?.last_fed_at,
        notification_interval: yourProfile?.notification_interval,
        last_notification_sent_at: yourProfile?.last_notification_sent_at,
      },
      step2_subscription: {
        exists: !!yourSubscription,
        endpoint_preview: yourSubscription?.endpoint?.substring(0, 50),
      },
      step3_notification_logic: {
        hunger_threshold: HUNGER_THRESHOLD,
        should_notify_by_hunger: shouldNotify,
        hours_since_last_notification: hoursSinceLastNotification.toFixed(2),
        notification_interval_hours: notificationInterval,
        interval_passed: intervalPassed,
        final_decision: shouldNotify && intervalPassed,
      },
      summary: {
        profile_ok: !!yourProfile,
        subscription_ok: !!yourSubscription,
        hunger_ok: shouldNotify,
        interval_ok: intervalPassed,
        all_conditions_met:
          !!yourProfile && !!yourSubscription && shouldNotify && intervalPassed,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
