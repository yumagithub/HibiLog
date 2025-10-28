"use client";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    // 本番環境とローカル環境でリダイレクトURLを切り替え
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    setRedirectUrl(`${baseUrl}/auth/callback`);
  }, []);

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

  // redirectUrlが設定されるまで待機
  if (!redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

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
          redirectTo={redirectUrl}
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

        {/* ゲストログイン・デモログイン */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/guest")}
            className="w-full clay-button"
          >
            <UserX className="h-4 w-4 mr-2" />
            ゲストとして始める
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            ゲストモードはログイン不要ですぐに始められます
          </p>
        </div>
      </div>
    </div>
  );
}
