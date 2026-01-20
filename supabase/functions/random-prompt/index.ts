import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * ランダム投稿促進通知を送信する Edge Function
 *
 * 1日1回、ランダムな時間に実行される想定
 * 前回送信から24時間以上経過したユーザーにのみ送信
 */

const RANDOM_MESSAGES = [
  {
    title: "📸 今日の一枚",
    body: "今日はどんな思い出を残しますか？",
  },
  {
    title: "✨ 思い出タイム",
    body: "バクが新しい思い出を待っています！",
  },
  {
    title: "🌟 今日の出来事",
    body: "今日あった素敵なことを記録しませんか？",
  },
  {
    title: "💭 ふりかえり",
    body: "今日1日をふりかえって、思い出を残しましょう。",
  },
  {
    title: "🎨 思い出づくり",
    body: "カメラを向けて、今この瞬間を記録しませんか？",
  },
];

function getRandomMessage() {
  const index = Math.floor(Math.random() * RANDOM_MESSAGES.length);
  return RANDOM_MESSAGES[index];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("[random-prompt] Starting random prompt notifications");

    // ランダム通知が有効なユーザーを取得
    // 前回送信から24時間以上経過しているか、まだ送信したことがないユーザー
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("baku_profiles")
      .select("user_id, last_random_prompt_sent_at")
      .eq("random_prompt_enabled", true)
      .or(
        `last_random_prompt_sent_at.is.null,last_random_prompt_sent_at.lt.${twentyFourHoursAgo}`,
      );

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      console.log("[random-prompt] No users to notify");
      return new Response(
        JSON.stringify({
          message: "No users to notify",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.log(`[random-prompt] Found ${profiles.length} users to notify`);

    // 各ユーザーに通知を送信
    let successCount = 0;
    const updatePromises: Promise<any>[] = [];

    for (const profile of profiles) {
      const message = getRandomMessage();

      try {
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              userId: profile.user_id,
              payload: {
                type: "random_prompt",
                title: message.title,
                body: message.body,
                icon: "/icon-192x192.png",
              },
            }),
          },
        );

        if (response.ok) {
          successCount++;
          console.log(`[random-prompt] Sent to user ${profile.user_id}`);

          // 送信時刻を記録
          updatePromises.push(
            supabaseAdmin
              .from("baku_profiles")
              .update({ last_random_prompt_sent_at: new Date().toISOString() })
              .eq("user_id", profile.user_id),
          );
        } else {
          console.error(
            `[random-prompt] Failed for user ${profile.user_id}: ${response.status}`,
          );
        }
      } catch (err) {
        console.error(
          `[random-prompt] Error for user ${profile.user_id}:`,
          err,
        );
      }
    }

    // 全ての送信時刻更新を待つ
    await Promise.all(updatePromises);

    console.log(
      `[random-prompt] Complete: ${successCount}/${profiles.length} sent`,
    );

    return new Response(
      JSON.stringify({
        message: "Random prompts sent",
        totalUsers: profiles.length,
        successCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[random-prompt] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
