import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * デバッグ用API: 空腹度と通知購読状況を確認
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Service Role Keyを使用してサーバーサイドから全データにアクセス
    const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // 空腹度が低いユーザーを取得
    const { data: hungryProfiles } = await supabase
      .from("baku_profiles")
      .select(
        "user_id, hunger_level, notification_interval, last_notification_sent_at"
      )
      .lte("hunger_level", 25)
      .order("hunger_level", { ascending: true })
      .limit(10);

    // Push購読者数を取得
    const { count: subscribersCount } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });

    // 全ての購読者を取得（デバッグ用）
    const { data: allSubscribers } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint");

    // 空腹かつ購読しているユーザー
    const { data: hungrySubscribers } = await supabase
      .from("baku_profiles")
      .select("user_id, hunger_level")
      .lte("hunger_level", 25)
      .in(
        "user_id",
        (
          await supabase.from("push_subscriptions").select("user_id")
        ).data?.map((s) => s.user_id) || []
      );

    return NextResponse.json({
      hungryProfilesCount: hungryProfiles?.length || 0,
      hungryProfiles: hungryProfiles?.slice(0, 5),
      totalSubscribers: subscribersCount || 0,
      allSubscribers: allSubscribers?.map((s) => ({
        user_id: s.user_id,
        endpoint: s.endpoint.substring(0, 50) + "...",
      })),
      hungrySubscribersCount: hungrySubscribers?.length || 0,
      message: `${hungryProfiles?.length || 0} hungry profiles, ${
        subscribersCount || 0
      } subscribers, ${
        hungrySubscribers?.length || 0
      } should receive notifications`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
