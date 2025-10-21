"use client"

import { useBakuStore } from "@/lib/store"
import { BakuDisplay } from "@/components/baku-display"
import { UploadTab } from "@/components/upload-tab"
import { MemoriesTab } from "@/components/memories-tab"
import { SettingsTab } from "@/components/settings-tab"

const CurrentView = () => {
  const activeView = useBakuStore((state) => state.activeView)

  switch (activeView) {
    case "upload":
      return <UploadTab />
    case "memories":
      return <MemoriesTab />
    case "settings":
      return <SettingsTab />
    default:
      return <UploadTab />
  }
}

export default function HibiLogApp() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">HibiLog</h1>
          <p className="text-sm text-muted-foreground">{"思い出を食べるバクを育てよう"}</p>
        </header>

        {/* Baku Character Display */}
        <BakuDisplay />

        {/* Content Area */}
        <main className="mt-8">
          <CurrentView />
        </main>
      </div>
    </div>

    
  )
}

