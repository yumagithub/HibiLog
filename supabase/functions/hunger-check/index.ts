import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://deno.land/x/web_push@0.2.2/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import type { BakuProfile, PushSubscription } from "../_shared/types.ts";

const HUNGER_THRESHOLD = 25;
// 48時間で100%減少するレート (1時間あたり)
const HUNGER_DECREASE_RATE = 100 / 48;

// VAPIDキーは環境変数から読み込む
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID keys are not set in environment variables.");
}

webpush.setVapidDetails(
  "mailto:your-email@example.com", // あとでユーザーに設定を促す
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Supabase Adminクライアントを初期化
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. 全てのバクのプロフィールを取得
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("baku_profiles")
      .select("user_id, hunger_level, last_fed_at");

    if (profilesError) throw profilesError;

    const profilesToUpdate: Partial<BakuProfile>[] = [];
    const notificationsToSend: Promise<any>[] = [];

    for (const profile of profiles as BakuProfile[]) {
      const now = Date.now();
      const lastFedTime = new Date(profile.last_fed_at).getTime();
      const hoursSinceLastFed = (now - lastFedTime) / (1000 * 60 * 60);

      // 2. 新しい空腹度を計算
      const hungerDecrease = hoursSinceLastFed * HUNGER_DECREASE_RATE;
      const newHunger = Math.max(0, 100 - hungerDecrease);

      profilesToUpdate.push({
        user_id: profile.user_id,
        hunger_level: newHunger,
      });

      // 3. 通知が必要か判断
      if (profile.hunger_level > HUNGER_THRESHOLD && newHunger <= HUNGER_THRESHOLD) {
        // 4. Push購読情報を取得
        const { data: subscription, error: subError } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", profile.user_id)
          .single();

        if (subError) {
          console.log(`No subscription found for user ${profile.user_id}`);
          continue;
        }

        // 5. 通知を送信
        const payload = JSON.stringify({
          title: "バクがお腹を空かせています！",
          body: "思い出を投稿してバクに食べさせてあげましょう。",
          icon: "/baku.png",
        });

        const pushPromise = webpush.sendNotification(
          subscription as PushSubscription,
          payload
        ).catch(err => console.error(`Failed to send notification to user ${profile.user_id}:`, err));
        
        notificationsToSend.push(pushPromise);
      }
    }

    // 6. 空腹度を一括更新
    if (profilesToUpdate.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("baku_profiles")
        .upsert(profilesToUpdate, { onConflict: "user_id" });
      if (updateError) throw updateError;
    }

    // 7. 全ての通知送信を待つ
    await Promise.all(notificationsToSend);

    return new Response(JSON.stringify({ message: "Hunger check complete." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
