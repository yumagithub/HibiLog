// app/camera/page.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, ArrowLeft } from "lucide-react";
import type { GeolocationData } from "@/lib/types";

type Facing = "user" | "environment";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<Facing>("environment");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationData>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const startStream = useCallback(
    async (mode: Facing = facingMode) => {
      setIsStarting(true);
      setError(null);
      try {
        stopStream();
        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false,
        });
        setStream(media);
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          await videoRef.current.play();
        }
      } catch (e) {
        setError(
          "カメラにアクセスできません。ブラウザの権限を確認してください。"
        );
      } finally {
        setIsStarting(false);
      }
    },
    [facingMode, stopStream]
  );

  // カメラページを開いた時に位置情報を取得
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("このブラウザは位置情報に対応していません");
      return;
    }

    setIsLoadingLocation(true);

    const options: PositionOptions = {
      enableHighAccuracy: true, // 高精度モード（GPS優先）
      timeout: 10000, // 10秒でタイムアウト
      maximumAge: 0, // キャッシュを使わない
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
        setLocationError(null);
        setIsLoadingLocation(false);
        console.log("✅ 位置情報取得成功:", position.coords);
      },
      // 【修正箇所】エラーハンドラーのログ出力方法を修正
      (error) => {
        // エラーコードとメッセージを明確に、かつオブジェクト形式で出力
        console.error("❌ 位置情報取得エラー:", {
          code: error.code,
          message: error.message,
          rawError: error, // 生のオブジェクトも出力し詳細を確保
        });
        setIsLoadingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "位置情報の使用が拒否されました。ブラウザの設定を確認してください。"
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "位置情報が利用できません。GPS/Wi-Fiをオンにしてください。"
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "位置情報の取得がタイムアウトしました。もう一度お試しください。"
            );
            break;
          default:
            setLocationError(
              `位置情報の取得に失敗しました (Code: ${error.code})`
            ); // 汎用エラーメッセージも詳細化
        }
      },
      options
    );
  };

  useEffect(() => {
    startStream("environment");
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = async () => {
    const next: Facing = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await startStream(next);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    if (w === 0 || h === 0) return;

    canvasRef.current.width = w;
    canvasRef.current.height = h;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);

    try {
      sessionStorage.setItem("camera:lastShot", dataUrl);

      // 位置情報を保存
      if (location) {
        console.log("📍 sessionStorageに位置情報を保存:", location);
        sessionStorage.setItem("camera:location", JSON.stringify(location));
      } else {
        console.warn("⚠️ 位置情報が取得されていません");
      }
    } catch {}

    // 2) 미리보기 페이지로 이동
    router.push("/camera/preview");
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-4">
          <Button asChild variant="outline" size="icon-sm">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">カメラ</h1>
        </header>

        <Card className="p-4 gap-4">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-3/4 flex items-center justify-center">
            <div className="absolute top-4 left-4 z-20">
              {" "}
              {/* z-20でカメラ上に表示 */}
              {isLoadingLocation && (
                <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  位置情報を取得中...
                </div>
              )}
              {location && !locationError && (
                <div className="bg-green-500/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
                  📍 位置情報取得済み（精度: {Math.round(location.accuracy)}m）
                </div>
              )}
              {locationError && (
                <div className="bg-red-500/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs max-w-xs">
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>
                    <div>
                      <p>{locationError}</p>
                      {/* requestLocation関数が外部で定義されていることを前提 */}
                      <button
                        onClick={requestLocation}
                        className="mt-1 underline text-blue-300"
                      >
                        再取得
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && <p className="text-sm text-destructive -mt-2">{error}</p>}

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
              onClick={handleCapture}
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
  );
}
