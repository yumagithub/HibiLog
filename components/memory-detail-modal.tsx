"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Calendar, FileText } from "lucide-react";
import type { Memory } from "./memories-tab";

interface MemoryDetailModalProps {
  memory: Memory | null;
  memories: Memory[];
  isOpen: boolean;
  onClose: () => void;
}

export function MemoryDetailModal({
  memory,
  memories,
  isOpen,
  onClose,
}: MemoryDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // memory が変更されたら currentIndex を更新
  useState(() => {
    if (memory) {
      const index = memories.findIndex((m) => m.id === memory.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  });

  if (!memory || memories.length === 0) return null;

  const currentMemory = memories[currentIndex] || memory;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < memories.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl w-full h-[90vh] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* 閉じるボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* ナビゲーションボタン - 前へ */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* ナビゲーションボタン - 次へ */}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        <div className="flex flex-col h-full">
          {/* 画像表示エリア */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {currentMemory.media_url && (
              <img
                src={currentMemory.media_url}
                alt={currentMemory.text_content || "Memory"}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* 詳細情報エリア */}
          <div className="bg-white p-6 space-y-4 max-h-[40%] overflow-y-auto">
            {/* 気分の絵文字 */}
            {currentMemory.mood_emoji && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-4xl">{currentMemory.mood_emoji}</span>
                <div className="text-sm text-muted-foreground">
                  この日の気分
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(currentMemory.memory_date).toLocaleDateString(
                  "ja-JP",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  }
                )}
              </span>
            </div>

            {currentMemory.text_content && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  <span>メッセージ</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentMemory.text_content}
                </p>
              </div>
            )}

            {/* サムネイル一覧 */}
            {memories.length > 1 && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {currentIndex + 1} / {memories.length}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {memories.map((mem, index) => (
                    <button
                      key={mem.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? "border-primary scale-110"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      {mem.media_url && (
                        <img
                          src={mem.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
