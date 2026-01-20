import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * 定期リマインダー通知を送信する Edge Function
 *
 * 毎時00分に実行され、現在時刻に設定されたユーザーに通知を送信
 * 例: 09:00に設定されたユーザーには、09:00-09:59の間に実行された時に送信
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 現在時刻を取得 (HH:mm形式)
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = "00"; // 毎時00分に実行されることを想定
    const currentTime = `${currentHour}:${currentMinute}`;

    console.log(`[daily-reminder] Running for time: ${currentTime}`);

    // 定期リマインダーが有効で、指定時刻のユーザーを取得
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("baku_profiles")
      .select("user_id, daily_reminder_time")
      .eq("daily_reminder_enabled", true)
      .eq("daily_reminder_time", currentTime);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      console.log(`[daily-reminder] No users configured for ${currentTime}`);
      return new Response(
        JSON.stringify({
          message: "No users to notify",
          time: currentTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.log(
      `[daily-reminder] Found ${profiles.length} users for ${currentTime}`,
    );

    // 各ユーザーに通知を送信
    let successCount = 0;
    const notificationPromises = profiles.map(async (profile) => {
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
                type: "daily_reminder",
                title: "📅 今日の思い出",
                body: "今日も素敵な1日を記録しましょう！",
                icon: "/icon-192x192.png",
              },
            }),
          },
        );

        if (response.ok) {
          successCount++;
          console.log(`[daily-reminder] Sent to user ${profile.user_id}`);
        } else {
          console.error(
            `[daily-reminder] Failed for user ${profile.user_id}: ${response.status}`,
          );
        }
      } catch (err) {
        console.error(
          `[daily-reminder] Error for user ${profile.user_id}:`,
          err,
        );
      }
    });

    await Promise.all(notificationPromises);

    console.log(
      `[daily-reminder] Complete: ${successCount}/${profiles.length} sent`,
    );

    return new Response(
      JSON.stringify({
        message: "Daily reminders sent",
        time: currentTime,
        totalUsers: profiles.length,
        successCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[daily-reminder] Error:", error);
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
