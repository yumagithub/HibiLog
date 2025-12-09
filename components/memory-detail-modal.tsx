"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
        className="max-w-4xl w-full h-[90vh] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* アクセシビリティ用の非表示タイトル */}
        <DialogTitle className="sr-only">
          思い出の詳細 - {currentMemory?.memory_date}
        </DialogTitle>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 閉じるボタン */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={onClose}
              asChild
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </Button>
          </motion.div>

          {/* ナビゲーションボタン - 前へ */}
          <AnimatePresence>
            {hasPrevious && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToPrevious}
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ナビゲーションボタン - 次へ */}
          <AnimatePresence>
            {hasNext && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToNext}
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full">
            {/* 画像表示エリア */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {currentMemory.media_url && (
                  <motion.img
                    key={currentMemory.id}
                    src={currentMemory.media_url}
                    alt={currentMemory.text_content || "Memory"}
                    className="max-w-full max-h-full w-auto h-auto object-contain mx-auto"
                    initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    layoutId={`memory-image-${currentMemory.id}`}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 詳細情報エリア */}
            <motion.div
              className="bg-white p-6 space-y-4 max-h-[40%] overflow-y-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMemory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* 気分の絵文字 */}
                  {currentMemory.mood_emoji && (
                    <motion.div
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.span
                        className="flex items-center justify-center"
                        animate={{
                          rotate: [0, 10, -10, 0],
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
                            width={64}
                            height={64}
                            className="w-16 h-16"
                          />
                        ) : (
                          <span className="text-4xl">
                            {currentMemory.mood_emoji}
                          </span>
                        )}
                      </motion.span>
                      <div className="text-sm text-muted-foreground">
                        この日の気分
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

              {/* サムネイル一覧 */}
              {memories.length > 1 && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {currentIndex + 1} / {memories.length}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {memories.map((mem, index) => (
                      <motion.button
                        key={mem.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentIndex
                            ? "border-primary"
                            : "border-transparent opacity-60"
                        }`}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        animate={
                          index === currentIndex
                            ? { scale: 1.1, opacity: 1 }
                            : { scale: 1, opacity: 0.6 }
                        }
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {mem.media_url && (
                          <Image
                            src={mem.media_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
