"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Memory } from "./memories-tab";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarViewProps {
  memories: Memory[];
  onDateClick: (date: string, memoriesForDate: Memory[]) => void;
}

// 日付ユーティリティ関数
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const formatDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

export function CalendarView({ memories, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 月の切り替え
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // メモリーを日付ごとにグループ化
  const memoriesByDate = useMemo(() => {
    const grouped: Record<string, Memory[]> = {};
    memories.forEach((memory) => {
      const dateKey = memory.memory_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(memory);
    });
    return grouped;
  }, [memories]);

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // 最初の空白セルを追加
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-4">
      {/* カレンダーヘッダー */}
      <Card className="clay-card p-4">
        <div className="flex items-center justify-between mb-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.h2
            key={`${currentYear}-${currentMonth}`}
            className="text-xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentYear}年 {currentMonth + 1}月
          </motion.h2>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-2 ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                  ? "text-blue-500"
                  : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            className="grid grid-cols-7 gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-3/4" />;
              }

              const dateKey = formatDateKey(currentYear, currentMonth, day);
              const dayMemories = memoriesByDate[dateKey] || [];
              const hasMemories = dayMemories.length > 0;
              const isToday =
                new Date().toDateString() ===
                new Date(currentYear, currentMonth, day).toDateString();

              return (
                <motion.div
                  key={dateKey}
                  className="aspect-3/4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.03, y: -6 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() =>
                      hasMemories && onDateClick(dateKey, dayMemories)
                    }
                    className={`
                      w-full h-full rounded-xl relative overflow-hidden
                      ${hasMemories ? "cursor-pointer" : "cursor-default"}
                      ${
                        isToday ? "ring-2 ring-primary" : "ring-1 ring-gray-200"
                      }
                      transition-all hover:shadow-lg
                    `}
                  >
                    {/* 背景画像 */}
                    {hasMemories && dayMemories[0].media_url && (
                      <div className="absolute inset-0">
                        <div className="relative w-full h-full">
                          <Image
                            src={dayMemories[0].media_url}
                            alt={`${dateKey}の思い出`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50px, 80px"
                          />
                        </div>
                        {/* オーバーレイ */}
                        <div className="absolute inset-0 bg-black/30" />
                      </div>
                    )}

                    {/* 日付番号 */}
                    <div
                      className={`
                      absolute top-2 left-2 font-bold
                      ${
                        hasMemories
                          ? "text-white text-xl drop-shadow-md"
                          : "text-foreground text-lg"
                      }
                      ${!hasMemories && "text-gray-400"}
                    `}
                    >
                      {day}
                    </div>

                    {/* 絵文字バッジ（右上） */}
                    {hasMemories && dayMemories[0].mood_emoji && (
                      <motion.div
                        className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: index * 0.01 + 0.1,
                          type: "spring",
                          stiffness: 200,
                          damping: 10,
                        }}
                        whileHover={{
                          scale: 1.15,
                          rotate: 12,
                          transition: { duration: 0.2 },
                        }}
                      >
                        {dayMemories[0].mood_emoji.startsWith("/") ? (
                          <Image
                            src={dayMemories[0].mood_emoji}
                            alt="mood"
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-xl">
                            {dayMemories[0].mood_emoji}
                          </span>
                        )}
                      </motion.div>
                    )}

                    {/* 複数投稿インジケーター */}
                    {dayMemories.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg">
                        {dayMemories.length}
                      </div>
                    )}

                    {/* 投稿なしの日 */}
                    {!hasMemories && (
                      <div className="absolute inset-0 clay-input flex items-center justify-center">
                        <span className="text-2xl font-light text-muted-foreground/30">
                          {day}
                        </span>
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
