'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from '@supabase/supabase-js'
import { createClient } from "@/lib/supabase/client"

import { useBakuStore } from "@/lib/store"
import { BakuDisplay } from "@/components/baku-display"
import { UploadTab } from "@/components/upload-tab"
import { MemoriesTab } from "@/components/memories-tab"
import { SettingsTab } from "@/components/settings-tab"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const CurrentView = ({ user }: { user: User }) => {
  const activeView = useBakuStore((state) => state.activeView)

  switch (activeView) {
    case "upload":
      return <UploadTab user={user} />
    case "memories":
      return <MemoriesTab user={user} />
    case "settings":
      return <SettingsTab user={user} />
    default:
      return <UploadTab user={user} />
  }
}

export default function HibiLogApp() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center">読み込み中...</div>
  }

  if (!user) {
    return null; // リダイレクトが実行されるまでの間、何も表示しない
  }

  return (
    <>
      <div className="min-h-screen gradient-bg pb-24 md:pb-6">
        <div className="container max-w-md md:max-w-full mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <header className="text-center mb-8 relative">
            <h1 className="text-4xl font-bold text-foreground mb-2">HibiLog</h1>
            <p className="text-sm text-muted-foreground">
              {"思い出を食べるバクを育てよう"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="absolute top-0 right-0"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </header>

          {/* Baku Character Display */}
          <BakuDisplay />

          {/* Content Area */}
          <main className="mt-8">
            <CurrentView user={user} />
          </main>
        </div>
      </div>
      <BottomNav />
    </>
  )
}

