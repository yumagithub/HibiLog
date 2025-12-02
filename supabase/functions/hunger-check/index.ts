import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import type { BakuProfile, PushSubscription } from "../_shared/types.ts";

const HUNGER_THRESHOLD = 25;
// 24時間で40%減少するレート (1時間あたり約1.67%)
// クライアント側の実装と一致させる
const HUNGER_DECREASE_RATE = 40 / 24;

// VAPIDキーは環境変数から読み込む
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@hibilog.app";

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID keys are not set in environment variables.");
}

// Web Push用のヘルパー関数
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: string
): Promise<boolean> {
  try {
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        payload: payload,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

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
    let updatedCount = 0;
    let notificationsSent = 0;

    console.log(`Processing ${profiles?.length || 0} profiles...`);

    for (const profile of profiles as BakuProfile[]) {
      const now = Date.now();
      const lastFedTime = new Date(profile.last_fed_at).getTime();
      const hoursSinceLastFed = (now - lastFedTime) / (1000 * 60 * 60);

      // 2. 新しい空腹度を計算（現在の値から減少させる）
      const hungerDecrease = hoursSinceLastFed * HUNGER_DECREASE_RATE;
      const calculatedHunger = Math.max(0, 100 - hungerDecrease);

      // 前回の値よりも減少した場合のみ更新
      const newHunger = Math.min(profile.hunger_level, calculatedHunger);

      if (newHunger !== profile.hunger_level) {
        profilesToUpdate.push({
          user_id: profile.user_id,
          hunger_level: newHunger,
        });
        updatedCount++;

        console.log(
          `User ${profile.user_id}: ${profile.hunger_level.toFixed(
            1
          )}% -> ${newHunger.toFixed(1)}% (${hoursSinceLastFed.toFixed(
            1
          )}h since last fed)`
        );
      }

      // 3. 通知が必要か判断（閾値を超えて下回った場合）
      if (
        profile.hunger_level > HUNGER_THRESHOLD &&
        newHunger <= HUNGER_THRESHOLD
      ) {
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
          icon: "/icon-192x192.png",
        });

        const pushPromise = sendWebPush(
          subscription as PushSubscription,
          payload
        )
          .then((success) => {
            if (success) {
              notificationsSent++;
              console.log(`Notification sent to user ${profile.user_id}`);
            } else {
              console.error(
                `Failed to send notification to user ${profile.user_id}`
              );
            }
          })
          .catch((err) => {
            console.error(
              `Failed to send notification to user ${profile.user_id}:`,
              err
            );
          });

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

    console.log(
      `Hunger check complete: ${updatedCount} profiles updated, ${notificationsSent} notifications sent.`
    );

    return new Response(
      JSON.stringify({
        message: "Hunger check complete.",
        profilesProcessed: profiles?.length || 0,
        profilesUpdated: updatedCount,
        notificationsSent: notificationsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in hunger check:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
