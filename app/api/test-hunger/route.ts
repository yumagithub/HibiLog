import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * テスト用API: 特定ユーザーの空腹度を強制的に設定
 * 開発環境でのみ使用
 */
export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { userId, hunger, resetNotification } = await request.json();

    if (!userId || hunger === undefined) {
      return NextResponse.json(
        { error: "userId and hunger are required" },
        { status: 400 }
      );
    }

    // Service Role Keyで全データにアクセス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 空腹度を更新
    // last_fed_atも更新して、指定された空腹度に対応する時刻を計算
    // 計算式: hunger = 100 - (hoursSinceLastFed × 1.67)
    // → hoursSinceLastFed = (100 - hunger) / 1.67
    const HUNGER_DECREASE_RATE = 40 / 24; // 1時間あたり約1.67%
    const hoursAgo = (100 - hunger) / HUNGER_DECREASE_RATE;
    const lastFedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const updateData: any = {
      hunger_level: hunger,
      last_fed_at: lastFedAt.toISOString(),
    };

    // resetNotificationがtrueの場合、last_notification_sent_atをnullにリセット
    if (resetNotification) {
      updateData.last_notification_sent_at = null;
    }

    const { error } = await supabase
      .from("baku_profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Hunger level set to ${hunger}% for user ${userId}, last_fed_at set to ${lastFedAt.toISOString()}${
        resetNotification ? ", notification reset" : ""
      }`,
    });
  } catch (error: any) {
    console.error("Test hunger error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
