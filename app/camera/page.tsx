// app/camera/page.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, ArrowLeft } from "lucide-react"

type Facing = "user" | "environment"

export default function CameraPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<Facing>("environment")
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
  }, [stream])

  const startStream = useCallback(async (mode: Facing = facingMode) => {
    setIsStarting(true)
    setError(null)
    try {
      stopStream()
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      })
      setStream(media)
      if (videoRef.current) {
        videoRef.current.srcObject = media
        await videoRef.current.play()
      }
    } catch (e) {
      setError("カメラにアクセスできません。ブラウザの権限を確認してください。")
    } finally {
      setIsStarting(false)
    }
  }, [facingMode, stopStream])

  useEffect(() => {
    startStream("environment")
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchCamera = async () => {
    const next: Facing = facingMode === "user" ? "environment" : "user"
    setFacingMode(next)
    await startStream(next)
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const w = videoRef.current.videoWidth
    const h = videoRef.current.videoHeight
    if (w === 0 || h === 0) return

    canvasRef.current.width = w
    canvasRef.current.height = h
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0, w, h)
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92)

    // 1) 세션 스토리지에 임시 저장
    try {
      sessionStorage.setItem("camera:lastShot", dataUrl)
    } catch {}

    // 2) 미리보기 페이지로 이동
    router.push("/camera/preview")
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-4">
          <Button asChild variant="outline" size="icon-sm">
            <Link href="/"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl font-bold">カメラ</h1>
        </header>

        <Card className="p-4 gap-4">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <p className="text-sm text-destructive -mt-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={switchCamera}
              disabled={isStarting}
              className="col-span-1"
              title="カメラの切り替え"
            >
              <RefreshCw className="mr-2" />
              反転
            </Button>

            <Button
              onClick={capture}
              disabled={!stream || isStarting}
              className="col-span-1"
              title="撮影"
            >
              <Camera className="mr-2" />
              撮影
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
