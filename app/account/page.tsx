"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Calendar, LogOut, ArrowLeft } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
          <h1 className="text-4xl font-bold text-foreground">アカウント情報</h1>
          <p className="text-sm text-muted-foreground mt-2">
            ログイン中のアカウント詳細
          </p>
        </header>

        {/* Account Information Card */}
        <Card className="p-6 space-y-6">
          {/* User ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              ユーザーID
            </Label>
            <div className="clay-input p-3">
              <p className="text-sm font-mono break-all">{user.id}</p>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="h-4 w-4" />
              メールアドレス
            </Label>
            <div className="clay-input p-3">
              <p className="text-sm">{user.email || "未設定"}</p>
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              認証方法
            </Label>
            <div className="clay-input p-3">
              <p className="text-sm capitalize">
                {user.app_metadata.provider || "email"}
              </p>
            </div>
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              アカウント作成日
            </Label>
            <div className="clay-input p-3">
              <p className="text-sm">
                {new Date(user.created_at).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Last Sign In */}
          {user.last_sign_in_at && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                最終ログイン
              </Label>
              <div className="clay-input p-3">
                <p className="text-sm">
                  {new Date(user.last_sign_in_at).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Email Confirmed */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              メール確認状態
            </Label>
            <div className="clay-input p-3">
              <p className="text-sm">
                {user.email_confirmed_at ? (
                  <span className="text-green-600 font-medium">✓ 確認済み</span>
                ) : (
                  <span className="text-yellow-600 font-medium">未確認</span>
                )}
              </p>
            </div>
          </div>

          {/* User Metadata */}
          {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                プロフィール情報
              </Label>
              <div className="clay-input p-3 space-y-2">
                {user.user_metadata.full_name && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      名前:{" "}
                    </span>
                    <span className="text-sm">
                      {user.user_metadata.full_name}
                    </span>
                  </div>
                )}
                {user.user_metadata.avatar_url && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      アバター:{" "}
                    </span>
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full inline-block ml-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              サインアウト
            </Button>
          </div>
        </Card>

        {/* Info Alert */}
        <Alert className="mt-6">
          <AlertDescription className="text-sm">
            このページでは、現在ログイン中のアカウントの詳細情報を確認できます。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
