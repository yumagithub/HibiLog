"use client"

import { MemoriesTab } from "@/components/memories-tab"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"

export default function MemoriesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen gradient-bg flex justify-center relative">
      {/* 📱 アプリ本体のスマホ枠 */}
      <div className="relative w-full max-w-md bg-transparent px-4 py-6">
        {/* ✅ 左上固定（スマホ枠の左上に配置） */}
        <button
          onClick={() => router.back()}
          className="
            absolute top-3 left-3 z-50
            flex items-center justify-center
            bg-background/80 backdrop-blur-md
            w-10 h-10 rounded-full shadow-md
            text-foreground hover:bg-accent hover:text-accent-foreground
            active:scale-95 transition
          "
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* ✅ 右上：カレンダーボタン */}
        <button
          onClick={() => router.push("/cale")} // ← 遷移先ページ指定（例: /calendar）
          className="
            absolute top-3 right-3 z-50
            flex items-center justify-center
            bg-background/80 backdrop-blur-md
            w-10 h-10 rounded-full shadow-md
            text-foreground hover:bg-accent hover:text-accent-foreground
            active:scale-95 transition
          "
          aria-label="カレンダー"
        >
          <Calendar className="h-5 w-5" />
        </button>
        {/* Header */}
        <header className="text-center mb-8 pt-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">思い出一覧</h1>
          <p className="text-sm text-muted-foreground">これまでの記録を見返そう</p>
        </header>

        {/* コンテンツ */}
        <MemoriesTab />
      </div>
    </div>
  )
}
