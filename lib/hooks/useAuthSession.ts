"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  // 認証チェックとセッション監視ロジック
  useEffect(() => {
    const checkUser = async () => {
      // ユーザーセッションを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // セッションがない場合はゲストモードとして続行
        setUser(null);
        setLoading(false);
        return;
      }

      // ログインユーザーの場合
      setUser(session.user);

      // public.usersテーブルにユーザーが存在するか確認、なければ作成
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (checkError && checkError.code === "PGRST116") {
        // ユーザーが存在しない場合、作成
        const { error: insertError } = await supabase.from("users").insert({
          id: session.user.id,
          email: session.user.email,
          is_anonymous: session.user.is_anonymous || false,
          created_at: session.user.created_at,
        });

        if (insertError) {
          console.error("ユーザー作成エラー:", insertError);
        } else {
          console.log("ユーザーレコードを作成しました");
        }
      }

      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (user) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  return { user, loading, handleLogout };
}
