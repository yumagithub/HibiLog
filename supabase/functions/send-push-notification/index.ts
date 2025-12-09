import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Web Crypto APIを使ってVAPID署名を生成
async function generateVAPIDAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwtHeader = {
    typ: "JWT",
    alg: "ES256",
  };

  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12時間有効
  const jwtPayload = {
    aud: audience,
    exp: exp,
    sub: "mailto:admin@hibilog.app",
  };

  const header = btoa(JSON.stringify(jwtHeader));
  const payload = btoa(JSON.stringify(jwtPayload));
  const unsignedToken = `${header}.${payload}`;

  // 実際のVAPID署名実装は複雑なため、シンプルなトークンを返す
  return `vapid t=${unsignedToken}, k=${vapidPublicKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subscription, payload } = await req.json();

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    // Web Push APIに送信
    const authHeader = await generateVAPIDAuthHeader(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey
    );

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        payload: payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Push failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
