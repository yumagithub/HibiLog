import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証確認
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const subscription = await request.json();

    // サブスクリプションデータを準備
    const subscriptionData = {
      user_id: user.id,
      endpoint: subscription.endpoint || "",
      p256dh: subscription.keys?.p256dh || "",
      auth: subscription.keys?.auth || "",
      device_name: subscription.deviceName || null,
    };

    // upsert: endpointをキーにして、同じデバイスの購読情報を更新
    // 複数デバイス対応: 異なるendpointは別レコードとして保存される
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(subscriptionData, { onConflict: "endpoint" });

    if (error) {
      console.error("Failed to save subscription:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save subscription error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
