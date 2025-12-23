"use client";

import { useState, useEffect } from "react";
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
import type { Memory } from "./memories-tab";
import { motion, AnimatePresence } from "framer-motion";

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
  useEffect(() => {
    if (memory) {
      const index = memories.findIndex((m) => m.id === memory.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [memory, memories]);

  if (!memory || memories.length === 0) return null;

  const currentMemory = memories[currentIndex] || memory;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < memories.length - 1;

  // 【追加】位置情報が存在するかチェックするヘルパー関数
  const hasLocation =
    currentMemory.latitude !== null && currentMemory.longitude !== null;

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
        className="max-w-4xl w-full max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
        aria-describedby="memory-description"
        style={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}
      >
        {/* アクセシビリティ用の非表示タイトル */}
        <DialogTitle className="sr-only">
          思い出の詳細 - {currentMemory?.memory_date}
        </DialogTitle>
        <DialogDescription id="memory-description" className="sr-only">
          {currentMemory?.text_content || "思い出の画像と詳細情報"}
        </DialogDescription>

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

        <div className="flex flex-col flex-1 w-full overflow-hidden">
          {/* 画像表示エリア */}
          <div
            className="bg-black relative flex items-center justify-center w-full"
            style={{
              height: "clamp(200px, 50vh, 500px)",
              flexShrink: 0,
            }}
          >
            {currentMemory.media_url ? (
              <img
                key={currentMemory.id}
                src={currentMemory.media_url}
                alt={currentMemory.text_content || "Memory"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
              />
            ) : (
              <div className="text-white text-center">画像がありません</div>
            )}
          </div>

          {/* 詳細情報エリア */}
          <div className="flex-1 bg-white overflow-y-auto flex flex-col min-h-0">
            <div className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMemory.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* 気分の絵文字 */}
                  {currentMemory.mood_emoji && (
                    <motion.div
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.span
                        className="flex items-center justify-center shrink-0"
                        animate={{
                          rotate: [0, 8, -8, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        {currentMemory.mood_emoji.startsWith("/") ? (
                          <Image
                            src={currentMemory.mood_emoji}
                            alt="mood"
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                        ) : (
                          <span className="text-2xl">
                            {currentMemory.mood_emoji}
                          </span>
                        )}
                      </motion.span>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {currentMemory.mood_emoji.startsWith("/")
                          ? "この日の気分"
                          : "この日の気分"}
                      </div>
                    </motion.div>
                  )}

                  {/* 日付と位置情報 */}
                  <div className="space-y-2">
                    {/* 日付 */}
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

                    {/* 【追加】位置情報表示ブロック */}
                    {hasLocation && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {currentMemory.location_name || "位置情報"}
                          </p>
                          {currentMemory.address && (
                            <p className="text-xs">{currentMemory.address}</p>
                          )}
                          <p className="text-xs opacity-70">
                            {currentMemory.latitude?.toFixed(6)},{" "}
                            {currentMemory.longitude?.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    )}
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
                </motion.div>
              </AnimatePresence>
            </div>

            {/* サムネイル一覧 */}
            {memories.length > 1 && (
              <div className="border-t bg-white px-6 py-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {currentIndex + 1} / {memories.length}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
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
                        <div className="relative w-full h-full">
                          <Image
                            src={mem.media_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
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
