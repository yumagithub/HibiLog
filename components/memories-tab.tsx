"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Calendar, AlertTriangle } from "lucide-react";

// データベースのmemoriesテーブルの型を定義
export type Memory = {
  id: string;
  created_at: string;
  memory_date: string;
  text_content: string | null;
  media_url: string | null;
  media_type: "photo" | "video" | null;
  user_id: string;
};

export function MemoriesTab() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("memories")
          .select("*")
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
  }, []);

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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {memories.map((memory) => (
        <div
          key={memory.id}
          className="clay-card rounded-lg group cursor-pointer transition-all duration-300 hover:-translate-y-1 relative overflow-hidden aspect-[4/3]"
        >
          {/* Background Image */}
          {memory.media_url && (
            <img
              src={memory.media_url}
              alt={memory.text_content || "Memory"}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          )}

          {/* Full Card Overlay */}
          <div className="full-card-overlay">
            {memory.text_content && (
              <p className="line-clamp-2 font-semibold text-sm mb-1">
                {memory.text_content}
              </p>
            )}
            <p className="text-xs font-medium">
              {new Date(memory.memory_date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
