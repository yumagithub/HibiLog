"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useBakuStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Grid3x3, CalendarDays } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MemoryDetailModal } from "@/components/memory-detail-modal";
import { CalendarView } from "@/components/calendar-view";
import { motion } from "framer-motion";

// データベースのmemoriesテーブルの型を定義
export type Memory = {
  id: string;
  created_at: string;
  memory_date: string;
  text_content: string | null;
  media_url: string | null;
  media_type: "photo" | "video" | null;
  user_id: string;
  mood_emoji: string | null;
  mood_category: string | null;
};

export function MemoriesTab({ user }: { user: User | null }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("calendar");
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const supabase = createClient();
  const localMemories = useBakuStore((state) => state.memories);

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
    setFilteredMemories(memories); // グリッドビューでは全てのメモリーを表示
    setIsModalOpen(true);
  };

  const handleDateClick = (date: string, memoriesForDate: Memory[]) => {
    if (memoriesForDate.length > 0) {
      setSelectedMemory(memoriesForDate[0]);
      setFilteredMemories(memoriesForDate); // カレンダービューでは選択した日付のメモリーのみ
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // モーダルのアニメーション後にselectedMemoryをクリア
    setTimeout(() => setSelectedMemory(null), 300);
  };

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          // ゲストモード: LocalStorageから取得
          const localMems = localMemories.map((m) => ({
            id: m.id,
            memory_date: m.timestamp.split("T")[0], // ISO形式からYYYY-MM-DDを抽出
            text_content: m.textContent || null,
            created_at: m.timestamp,
            updated_at: m.timestamp,
            media_url: m.imageUrl,
            media_type: "photo" as const,
            user_id: "guest",
            mood_emoji: m.moodEmoji || null,
            mood_category: m.moodCategory || null,
          }));
          setMemories(localMems);
          setLoading(false);
          return;
        }

        // ログインユーザー: Supabaseから取得
        const { data, error } = await supabase
          .from("memories")
          .select("*")
          .eq("user_id", user.id)
          .order("memory_date", { ascending: false });

        if (error) {
          throw error;
        }
        setMemories(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [user, localMemories]);

  if (loading) {
    return (
      <Card className="p-12 text-center clay-input">
        <p>読み込み中...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-12 text-center clay-input border-destructive">
        <div className="flex flex-col items-center gap-4 text-destructive">
          <AlertTriangle className="h-16 w-16" />
          <div>
            <p className="font-bold">エラーが発生しました</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (memories.length === 0) {
    return (
      <Card className="p-12 text-center clay-input">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Calendar className="h-16 w-16 opacity-50" />
          <div>
            <p className="font-medium">まだ思い出がありません</p>
            <p className="text-sm mt-1">写真をアップロードして始めましょう</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* ビュー切り替えボタン */}
      <div className="flex justify-end gap-2 mb-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            カレンダー
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            グリッド
          </Button>
        </motion.div>
      </div>

      {/* カレンダービュー */}
      {viewMode === "calendar" && (
        <CalendarView memories={memories} onDateClick={handleDateClick} />
      )}

      {/* グリッドビュー */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memories.map((memory, index) => (
            <motion.div
              key={memory.id}
              onClick={() => handleMemoryClick(memory)}
              onMouseEnter={() => setHoveredId(memory.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="clay-card rounded-lg group cursor-pointer relative overflow-hidden aspect-4/3"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              whileTap={{ scale: 0.98 }}
              layoutId={`memory-card-${memory.id}`}
            >
              {/* Background Image */}
              {memory.media_url && (
                <motion.img
                  src={memory.media_url}
                  alt={memory.text_content || "Memory"}
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Mood Emoji Badge */}
              {memory.mood_emoji && (
                <motion.div
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: index * 0.1 + 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  whileHover={{
                    scale: 1.2,
                    rotate: 360,
                    transition: { duration: 0.5 },
                  }}
                >
                  {memory.mood_emoji.startsWith("/") ? (
                    <Image
                      src={memory.mood_emoji}
                      alt="mood"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  ) : (
                    <span className="text-2xl">{memory.mood_emoji}</span>
                  )}
                </motion.div>
              )}

              {/* Full Card Overlay */}
              <motion.div
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 text-white pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredId === memory.id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {memory.text_content && (
                  <motion.p
                    className="line-clamp-2 font-semibold text-sm mb-1"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{
                      y: hoveredId === memory.id ? 0 : 10,
                      opacity: hoveredId === memory.id ? 1 : 0,
                    }}
                    transition={{ delay: 0.1 }}
                  >
                    {memory.text_content}
                  </motion.p>
                )}
                <motion.p
                  className="text-xs font-medium"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{
                    y: hoveredId === memory.id ? 0 : 10,
                    opacity: hoveredId === memory.id ? 1 : 0,
                  }}
                  transition={{ delay: 0.15 }}
                >
                  {new Date(memory.memory_date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </motion.p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      <MemoryDetailModal
        memory={selectedMemory}
        memories={filteredMemories}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
