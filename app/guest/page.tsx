"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserX, Loader2, Info } from "lucide-react";

export default function GuestLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 匿名でサインイン
      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }

      console.log("ゲストログイン成功:", data);

      // トリガー関数がユーザーレコードを自動作成するため、
      // ここでは作成されたか確認するだけ
      if (data.user) {
        // 少し待ってからユーザーレコードの存在を確認
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data: userData, error: checkError } = await supabase
          .from("users")
          .select("id, is_anonymous")
          .eq("id", data.user.id)
          .single();

        if (checkError) {
          console.warn("ユーザーレコード確認エラー:", checkError);
        } else if (userData) {
          console.log("✅ ユーザーレコード確認成功:", userData);
        }
      }

      // メインページにリダイレクト
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("ゲストログインエラー:", err);
      setError(
        err instanceof Error ? err.message : "ゲストログインに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <UserX className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">ゲストモード</h1>
          <p className="text-muted-foreground">
            ログインなしでHibiLogを試すことができます
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 説明カード */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            ゲストモードについて
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>ログイン不要ですぐに始められます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>バクを育てたり、思い出を投稿できます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>データはブラウザに保存されます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">⚠</span>
              <span className="text-yellow-600">
                ブラウザのデータを消去すると、思い出が失われます
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">💡</span>
              <span className="text-blue-600">
                後からアカウント登録して、データを引き継ぐことができます
              </span>
            </li>
          </ul>
        </Card>

        {/* ゲストログインボタン */}
        <Button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full clay-button"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              準備中...
            </>
          ) : (
            <>
              <UserX className="h-5 w-5 mr-2" />
              ゲストとして始める
            </>
          )}
        </Button>

        {/* 通常ログインへのリンク */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            既にアカウントをお持ちの方
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full"
          >
            ログイン
          </Button>
        </div>
      </div>
    </div>
  );
}
