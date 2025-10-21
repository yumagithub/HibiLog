// app/camera/preview/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CameraPreviewPage() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("camera:lastShot")
      setUrl(stored)
    } catch {
      setUrl(null)
    }
  }, [])

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-4">
          <Button asChild variant="outline" size="icon-sm">
            <Link href="/camera"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl font-bold">プレビュー</h1>
        </header>

        <Card className="p-4 gap-4">
          {!url ? (
            <div className="text-sm text-muted-foreground space-y-3">
              <p>表示できる画像がありません。</p>
              <Button asChild>
                <Link href="/camera">カメラに戻る</Link>
              </Button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[3/4]">
              <Image
                src={url}
                alt="captured"
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
