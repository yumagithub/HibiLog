import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 現在のユーザー情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ユーザーのバクプロフィールも取得
    const { data: profile } = await supabase
      .from("baku_profiles")
      .select("hunger_level, notification_interval")
      .eq("user_id", user.id)
      .single();

    // Push購読状況も確認
    const { data: subscription } = await supabase
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      hungerLevel: profile?.hunger_level,
      notificationInterval: profile?.notification_interval,
      hasPushSubscription: !!subscription,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
