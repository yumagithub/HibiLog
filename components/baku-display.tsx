"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useBakuStore } from "@/lib/store";

type BakuStatus = "healthy" | "normal" | "hungry" | "critical";

const statusEmojis: Record<BakuStatus, string> = {
  healthy: "😊",
  normal: "😐",
  hungry: "😟",
  critical: "😵",
};

const statusColors: Record<BakuStatus, string> = {
  healthy: "bg-green-500",
  normal: "bg-blue-500",
  hungry: "bg-yellow-500",
  critical: "bg-red-500",
};

const statusMessages: Record<BakuStatus, string> = {
  healthy: "バクは元気いっぱいです！",
  normal: "バクは普通の状態です",
  hungry: "バクがお腹を空かせています",
  critical: "危険！バクに思い出を食べさせてください！",
};

export function BakuDisplay() {
  const { hunger, lastFed, status } = useBakuStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Critical Alert */}
      {status === "critical" && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {statusMessages.critical}
          </AlertDescription>
        </Alert>
      )}

      {/* Baku Character Card */}
      <Card className="relative overflow-hidden border-2 baku-glow">
        {/* Baku Character Area */}
        <div className="aspect-square md:aspect-auto md:h-[40vh] relative flex items-center justify-center p-8 pb-28">
          {/* Baku Character Illustration */}
          <div className="relative">
            <div className="w-32 h-32 animate-bounce-slow">
              <Image
                src="/baku.png"
                alt="Baku"
                width={256}
                height={256}
                priority
              />
            </div>

            {/* Status Emoji Badge */}
            <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-3 shadow-lg border-2 border-background">
              <span className="text-3xl">{statusEmojis[status]}</span>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-white/90 backdrop-blur-md rounded-b-[26px]">
          <div className="text-centerp-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              状態
            </p>
            <p className="text-lg font-bold text-foreground">
              {statusMessages[status]}
            </p>
          </div>

          {/* Hunger Bar */}
          <div className="space-y-2p-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>満腹度</span>
              <span>{hunger}%</span>
            </div>
            <Progress
              value={hunger}
              className={`h-3 ${statusColors[status]}`}
            />
          </div>

          {lastFed && (
            <p className="text-xs text-center text-muted-foreground clay-input p-3">
              最後の食事: {new Date(lastFed).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
