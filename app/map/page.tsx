"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MemoryMap } from "@/components/memory-map";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function MapPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // ゲストモードの場合はホームに戻る
        router.push("/");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">思い出マップ</h1>
              <p className="text-xs text-gray-500">
                あなたの思い出の場所を探索しよう
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <MemoryMap userId={user.id} />
        </div>

        {/* 使い方のヒント */}
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">💡 使い方</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>📍 マーカーをクリックすると、その場所の思い出が表示されます</li>
            <li>🔍 マップをピンチ/スクロールして拡大・縮小できます</li>
            <li>🎨 絵文字はその時の気分を表しています</li>
          </ul>
        </div>
      </main>
    </div>
  );
}