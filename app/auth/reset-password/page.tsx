// ./app/auth/
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string>("");

  // 1) hash(#access_token=...&refresh_token=...)를 읽어 세션 세팅
  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    (async () => {
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          setMsg(`セッション設定に失敗しました: ${error.message}`);
          return;
        }

        // 토큰이 주소창에 남지 않게 hash 제거 (보안상 권장)
        router.replace("/auth/reset-password");
      }
    })();
  }, [supabase, router]);

  // 2) 비밀번호 업데이트
  const onSubmit = async () => {
    setMsg("");

    if (pw.length < 8) {
      setMsg("パスワードは8文字以上にしてください。");
      return;
    }
    if (pw !== pw2) {
      setMsg("パスワードが一致しません。");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-3">
        <h1 className="text-xl font-bold">パスワードを再設定</h1>

        <input
          className="w-full border p-2"
          type="password"
          placeholder="新しいパスワード"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="password"
          placeholder="新しいパスワード（確認）"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />

        <button className="w-full border p-2" onClick={onSubmit}>
          更新
        </button>

        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </div>
  );
}
