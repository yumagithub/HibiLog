"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SettingsTab } from "@/components/settings-tab"

export default function SettingsPage() {
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
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">設定</h1>
        </header>
        <SettingsTab />
      </div>
    </div>
  )
}
