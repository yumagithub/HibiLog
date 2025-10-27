"use client";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // ログイン後にホームページにリダイレクト
        router.push("/");
        // ページをリフレッシュしてサーバーセッションを更新
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="w-full max-w-md p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-foreground">
            HibiLog
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            ログインまたは新規登録
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={`${window.location.origin}/auth/callback`}
          localization={{
            variables: {
              sign_in: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "サインイン",
                social_provider_text: "{{provider}}で続ける",
                link_text: "アカウントをお持ちの方はこちら",
              },
              sign_up: {
                email_label: "メールアドレス",
                password_label: "パスワード",
                button_label: "サインアップ",
                social_provider_text: "{{provider}}で続ける",
                link_text: "アカウントを作成しますか？",
              },
              forgotten_password: {
                email_label: "メールアドレス",
                button_label: "パスワード再設定メールを送信",
                link_text: "パスワードをお忘れですか？",
                loading_button_label: "読み込み中...",
                password_label: "パスワード",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
