"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBakuStore } from "@/lib/store";
import { Bug, Plus, Minus, RotateCcw, FastForward } from "lucide-react";
import { useState } from "react";

export function HungerDebugPanel() {
  const {
    hunger,
    lastFed,
    status,
    updateHunger,
    feedBaku,
    setHunger,
    setLastFed,
  } = useBakuStore();
  const [isVisible, setIsVisible] = useState(false);

  // 時間を進める（テスト用）
  const fastForwardTime = (hours: number) => {
    if (!lastFed) return;
    const newTime = new Date(
      new Date(lastFed).getTime() - hours * 60 * 60 * 1000
    );
    setLastFed(newTime.toISOString());
    updateHunger();
  };

  // 空腹度を直接変更
  const adjustHunger = (amount: number) => {
    const newHunger = Math.max(0, Math.min(100, hunger + amount));
    setHunger(newHunger);
  };

  // リセット
  const resetBaku = () => {
    setHunger(100);
    setLastFed(new Date().toISOString());
  };

  return (
    <>
      {/* トグルボタン */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-24 right-4 md:bottom-4 z-50 clay-button"
        size="icon"
      >
        <Bug className="h-5 w-5" />
      </Button>

      {/* デバッグパネル */}
      {isVisible && (
        <Card className="fixed bottom-36 right-4 md:bottom-16 w-80 max-w-[calc(100vw-2rem)] p-4 space-y-4 z-50 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bug className="h-5 w-5" />
              デバッグパネル
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>

          {/* 現在の状態 */}
          <div className="space-y-2 p-3 clay-input rounded-lg">
            <div className="flex justify-between text-sm">
              <Label>空腹度:</Label>
              <span className="font-mono font-bold">{hunger}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <Label>ステータス:</Label>
              <span className="font-mono font-bold capitalize">{status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <Label>最終給餌:</Label>
              <span className="font-mono text-xs">
                {lastFed
                  ? new Date(lastFed).toLocaleTimeString("ja-JP")
                  : "未設定"}
              </span>
            </div>
            {lastFed && (
              <div className="flex justify-between text-sm">
                <Label>経過時間:</Label>
                <span className="font-mono text-xs">
                  {Math.round(
                    (Date.now() - new Date(lastFed).getTime()) / 60000
                  )}
                  分
                </span>
              </div>
            )}
          </div>

          {/* 空腹度調整 */}
          <div className="space-y-2">
            <Label>空腹度を調整</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => adjustHunger(-25)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Minus className="h-3 w-3 mr-1" />
                -25%
              </Button>
              <Button
                onClick={() => adjustHunger(-10)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Minus className="h-3 w-3 mr-1" />
                -10%
              </Button>
              <Button
                onClick={() => adjustHunger(25)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                +25%
              </Button>
            </div>
          </div>

          {/* 時間を進める */}
          <div className="space-y-2">
            <Label>時間を進める</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => fastForwardTime(1)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <FastForward className="h-3 w-3 mr-1" />
                1時間
              </Button>
              <Button
                onClick={() => fastForwardTime(3)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <FastForward className="h-3 w-3 mr-1" />
                3時間
              </Button>
              <Button
                onClick={() => fastForwardTime(6)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <FastForward className="h-3 w-3 mr-1" />
                6時間
              </Button>
            </div>
          </div>

          {/* アクション */}
          <div className="space-y-2">
            <Label>アクション</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => feedBaku()}
                className="clay-button text-xs"
                size="sm"
              >
                給餌 (+25%)
              </Button>
              <Button
                onClick={() => resetBaku()}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                リセット
              </Button>
            </div>
            <Button
              onClick={() => updateHunger()}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              空腹度を再計算
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            💡
            このパネルは開発用です。時間を進めたり、空腹度を直接変更してテストできます。
          </div>
        </Card>
      )}
    </>
  );
}
