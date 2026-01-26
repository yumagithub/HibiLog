"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  FileText,
  MapPin,
} from "lucide-react";
import type { Memory } from "@/app/memories/page";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  memories: Memory[];
  onClose: () => void;
}

export function LocationHighlightModal({
  isOpen,
  memories,
  onClose,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 最新 → 過去 の順に確実に並び替え
  const orderedMemories = useMemo(() => {
    return [...memories].sort((a, b) => {
      const timeA = new Date(a.created_at || a.memory_date).getTime();
      const timeB = new Date(b.created_at || b.memory_date).getTime();
      return timeB - timeA;
    });
  }, [memories]);

  // モーダルが開かれたときにインデックスをリセット
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // 4秒ごとに自動スライド
  useEffect(() => {
    if (!isOpen || orderedMemories.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % orderedMemories.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, orderedMemories]);

  if (orderedMemories.length === 0) return null;

  const currentMemory = orderedMemories[currentIndex];

  const hasPrevious = currentIndex > 0; // 未来側
  const hasNext = currentIndex < orderedMemories.length - 1; // 過去側

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl w-full max-h-[90vh] p-0 gap-0 overflow-hidden shadow-lg bg-black/30 backdrop-blur flex flex-col [&>button:last-child]:hidden"
        aria-describedby="location-description"
        style={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}
      >
        <DialogTitle className="sr-only">
          この場所での思い出 - {currentMemory?.memory_date}
        </DialogTitle>
        <DialogDescription id="location-description" className="sr-only">
          📍 以前にもこの場所で思い出があります
        </DialogDescription>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

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

        <div className="flex flex-col flex-1 w-full overflow-hidden ">
          <div
            className="bg-black relative flex items-center justify-center w-full"
            style={{ height: "clamp(200px, 50vh, 500px)", flexShrink: 0 }}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur px-4 py-1 rounded-full shadow-lg border flex items-center gap-2">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">
                以前にもこの場所で思い出があります
              </span>
            </div>

            <AnimatePresence initial={false} >
              <motion.img
                key={currentMemory.id}
                src={currentMemory.media_url || ""}
                alt="Memory"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(e, { offset }) => {
                  const swipeThreshold = 50;
                  // 左にスワイプ（offset.x がマイナス）＝ 次（過去）へ
                  if (offset.x < -swipeThreshold && hasNext) {
                    goToNext();
                  }
                  // 右にスワイプ（offset.x がプラス）＝ 前（未来）へ
                  else if (offset.x > swipeThreshold && hasPrevious) {
                    goToPrevious();
                  }
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, position: "absolute" }}
                transition={{ duration: 0.4 }}
                className="touch-none cursor-grab active:cursor-grabbing"
                style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}              />
            </AnimatePresence>
          </div>

          <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 flex flex-col h-full min-h-0">
              {/* ★ 修正ポイント：日付と絵文字を左右に振り分けるコンテナ */}
              <div className="flex items-center justify-between pb-4 flex-shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-bold text-foreground">
                      {new Date(currentMemory.memory_date).toLocaleDateString("ja-JP", {
                        year: "numeric", month: "long", day: "numeric", weekday: "long"
                      })}
                    </span>
                  </div>
                </div>

                {/* ★ 右側に感情絵文字を固定 */}
                {currentMemory.mood_emoji && (
                  <div className="flex-shrink-0 ml-4">
                    {currentMemory.mood_emoji.startsWith("/") ? (
                      <Image
                        src={currentMemory.mood_emoji}
                        alt="Mood"
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <span className="text-3xl leading-none">{currentMemory.mood_emoji}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. メッセージエリア：flex-1 と overflow-y-auto で「空いている場所」を埋める */}
              <div className="flex min-h-0 mt-4 overflow-y-auto">
                <div className="h-full px-2">
                {currentMemory.text_content ? (
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {currentMemory.text_content}
                    </p>
                  ) : null}  
                </div>
              </div>
            </div>

            {orderedMemories.length > 1 && (
              <div className="mt-auto border-t bg-gray-50/50 px-6 py-4">
                <div className="flex gap-2 overflow-x-auto pb-1 items-center justify-center">
                  {orderedMemories.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
                  {orderedMemories.length}件中 {currentIndex + 1}件目を表示
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}