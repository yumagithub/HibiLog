"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useBakuStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  Grid3x3,
  CalendarDays,
  MapPin,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MemoryDetailModal } from "@/components/memory-detail-modal";
import { CalendarView } from "@/components/calendar-view";
import { motion } from "framer-motion";
import { MOOD_OPTIONS, MoodOption } from "@/lib/mood-emojis";

// shadcn/ui Calendar & Popover
import { Calendar as FilterCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// ★ ローカルタイム基準で YYYY-MM-DD 文字列を作るヘルパー
function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // "YYYY-MM-DD"
}

// Supabase memories テーブル型
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
  // 【修正】位置情報関連の全プロパティを追加
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  address: string | null;
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

  // 🔍 フィルタ状態
  const [searchQuery, setSearchQuery] = useState(""); // テキスト検索
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null); // 感情
  const [isMoodDropdownOpen, setIsMoodDropdownOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // 日付
  const [isDateOpen, setIsDateOpen] = useState(false); // ポップオーバー

  const supabase = createClient();
  const localMemories = useBakuStore((state) => state.memories);

  // 🎞 メモリー取得 (Supabase or Local)
  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          const localMems: Memory[] = localMemories.map((m) => ({
            id: m.id,
            memory_date: m.timestamp.split("T")[0],
            text_content: m.textContent || null,
            created_at: m.timestamp,
            media_url: m.imageUrl,
            media_type: "photo",
            user_id: "guest",
            mood_emoji: m.moodEmoji || null,
            mood_category: m.moodCategory || null,
            // 【重要】位置情報をマッピング
            latitude: (m as any).latitude || null,
            longitude: (m as any).longitude || null,
            location_name: (m as any).location_name || null,
            address: (m as any).address || null,
          }));
          setMemories(localMems);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("memories")
          .select("*")
          .eq("user_id", user.id)
          .order("memory_date", { ascending: false });

        if (error) throw error;
        setMemories((data as Memory[]) || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [user, localMemories, supabase]);

  // 🔍 AND条件フィルタリング
  const filteredForView =
    viewMode === "grid"
      ? memories.filter((memory) => {
          // 日付フィルタ（ローカル基準で比較）
          if (selectedDate) {
            const memDate = (memory.memory_date || "").slice(0, 10); // "YYYY-MM-DD"
            const filterDate = formatDateToYMD(selectedDate); // "YYYY-MM-DD"
            if (memDate !== filterDate) return false;
          }
          // 感情フィルタ
          if (selectedMood) {
            const emojiMatch =
              memory.mood_emoji === selectedMood.emoji ||
              memory.mood_emoji === selectedMood.label;
            const categoryMatch =
              memory.mood_category === selectedMood.category;
            if (!emojiMatch && !categoryMatch) return false;
          }
          // テキストフィルタ
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          const text = (memory.text_content || "").toLowerCase();
          return text.includes(q);
        })
      : memories;

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
    setFilteredMemories(filteredForView);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMemory(null), 300);
  };

  if (loading)
    return <Card className="p-12 text-center clay-input">読み込み中...</Card>;

  if (error)
    return (
      <Card className="p-12 text-center clay-input border-destructive">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <p className="mt-2 text-destructive">{error}</p>
      </Card>
    );

  if (memories.length === 0)
    return (
      <Card className="p-12 text-center clay-input">
        <CalendarIcon className="h-16 w-16 opacity-50" />
        <p className="mt-2 text-muted-foreground">思い出がありません</p>
      </Card>
    );

  // 位置情報を持っているかどうかをチェックするヘルパー関数
  const hasLocation = (memory: Memory) =>
    memory.latitude !== null && memory.longitude !== null;

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "日付";

  return (
    <>
      {/* 📅 ビュー切替 */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setViewMode("calendar")}
        >
          <CalendarDays className="h-4 w-4" />
          カレンダー
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setViewMode("grid")}
        >
          <Grid3x3 className="h-4 w-4" />
          グリッド
        </Button>
      </div>

      {/* 📅 カレンダービュー */}
      {viewMode === "calendar" && (
        <CalendarView memories={memories} onDateClick={() => {}} />
      )}

      {/* 📸 グリッドビュー */}
      {viewMode === "grid" && (
        <>
          {/* 🔍 フィルタ UI */}
          <div className="mb-4 flex items-center gap-2">
            {/* 📅 日付フィルタ */}
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedDate ? "default" : "outline"}
                  size="sm"
                  className="min-w-[140px] justify-between"
                >
                  <span className="text-xs truncate">{dateLabel}</span>
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 bg-background border rounded-xl shadow-lg">
                <FilterCalendar
                  mode="single"
                  selected={selectedDate ?? undefined}
                  onSelect={(date) => {
                    setSelectedDate(date ?? null);
                    if (date) setIsDateOpen(false);
                  }}
                />
                {selectedDate && (
                  <button
                    className="mt-2 text-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() => setSelectedDate(null)}
                  >
                    日付クリア
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* 🔍 キーワード */}
            <input
              className="flex-1 px-3 py-2 clay-input text-sm"
              placeholder="キーワード検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* 😀 感情 */}
            <div className="relative">
              <Button
                type="button"
                variant={selectedMood ? "default" : "outline"}
                size="icon"
                className="w-10 h-10"
                onClick={() => setIsMoodDropdownOpen((v) => !v)}
              >
                {selectedMood ? (
                  <span className="text-xl">{selectedMood.emoji}</span>
                ) : (
                  <span className="text-xs">感情</span>
                )}
              </Button>

              {isMoodDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 clay-card z-20 p-2 rounded-xl border">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.emoji}
                      className="w-full flex items-center gap-2 px-2 py-1 hover:bg-muted"
                      onClick={() => {
                        setSelectedMood(mood);
                        setIsMoodDropdownOpen(false);
                      }}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-xs">{mood.label}</span>
                    </button>
                  ))}
                  {selectedMood && (
                    <button
                      className="text-[10px] mt-1 text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedMood(null)}
                    >
                      感情クリア
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 📸 Grid list */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredForView.length === 0 ? (
              <p className="col-span-3 text-center text-sm text-muted-foreground">
                該当する思い出が見つかりません
              </p>
            ) : (
              filteredForView.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  className="clay-card relative rounded-lg overflow-hidden aspect-4/3 group"
                  onClick={() => handleMemoryClick(memory)}
                  onMouseEnter={() => setHoveredId(memory.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  {memory.media_url && (
                    <motion.img
                      src={memory.media_url}
                      alt="memory"
                      className="absolute w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
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
                      <span className="text-2xl">{memory.mood_emoji}</span>
                    </motion.div>
                  )}

                  {/* 位置情報アイコン */}
                  {hasLocation(memory) && (
                    <motion.div
                      className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-80"
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{
                        delay: index * 0.1 + 0.4,
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <MapPin className="h-4 w-4 text-gray-700" />
                    </motion.div>
                  )}

                  {/* Full Card Overlay */}
                  <motion.div
                    className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-transparent to-transparent p-3 text-white pointer-events-none"
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
                    <p className="text-xs">
                      {new Date(memory.memory_date).toLocaleDateString(
                        "ja-JP",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                  </motion.div>
                </motion.div>
              ))
            )}
          </div>
        </>
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
