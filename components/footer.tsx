"use client"

import { Camera, ImageIcon, Settings } from "lucide-react"
import { useBakuStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type View = "upload" | "memories" | "settings"

export function Footer() {
  const { activeView, setActiveView } = useBakuStore()

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: "upload", label: "投稿", icon: <Camera className="h-5 w-5" /> },
    { view: "memories", label: "思い出", icon: <ImageIcon className="h-5 w-5" /> },
    { view: "settings", label: "設定", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t z-10">
      <nav className="container max-w-md mx-auto grid grid-cols-3 text-center">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 text-sm font-medium transition-colors",
              activeView === item.view
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </footer>
  )
}
