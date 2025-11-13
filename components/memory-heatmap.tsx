// components/memory-heatmap.tsx
"use client";

import { useMemo } from "react";

interface HeatmapDay {
  date: string;
  count: number;
  dayOfWeek: number;
  weekIndex: number;
}

interface MemoryHeatmapProps {
  memories: Array<{ memory_date: string }>;
  weeks?: number; // 表示する週数（デフォルト: 52週）
}

export function MemoryHeatmap({ memories, weeks = 52 }: MemoryHeatmapProps) {
  const heatmapData = useMemo(() => {
    // 今日から過去N週間分のデータを生成
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - weeks * 7);

    // 日付ごとの投稿数をカウント
    const countByDate: { [key: string]: number } = {};
    memories.forEach((memory) => {
      const dateStr = memory.memory_date.split("T")[0];
      countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
    });

    // ヒートマップ用のデータ配列を生成
    const heatmapDays: HeatmapDay[] = [];
    const currentDate = new Date(startDate);

    // 開始日を日曜日に調整
    const startDayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - startDayOfWeek);

    let weekIndex = 0;
    while (weekIndex < weeks) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = countByDate[dateStr] || 0;

        heatmapDays.push({
          date: dateStr,
          count,
          dayOfWeek,
          weekIndex,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weekIndex++;
    }

    return heatmapDays;
  }, [memories, weeks]);

  // 投稿数に応じた色を返す
  const getColorClass = (count: number): string => {
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-300";
    if (count === 3) return "bg-green-400";
    return "bg-green-500";
  };

  // 月のラベルを生成
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    heatmapData.forEach((day) => {
      if (day.dayOfWeek === 0) {
        // 日曜日のみチェック
        const date = new Date(day.date);
        const month = date.getMonth();

        if (month !== lastMonth) {
          labels.push({
            month: date.toLocaleDateString("ja-JP", { month: "short" }),
            weekIndex: day.weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [heatmapData]);

  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* 月のラベル */}
        <div className="flex mb-1 ml-8 text-[10px] text-gray-500">
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{
                left: `${label.weekIndex * 14 + 32}px`,
              }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* 曜日ラベル */}
          <div className="flex flex-col text-[9px] text-gray-500 mr-1">
            {dayLabels.map((label, idx) => (
              <div
                key={idx}
                className="h-[11px] flex items-center"
                style={{
                  visibility: idx % 2 === 1 ? "visible" : "hidden",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* ヒートマップグリッド */}
          <div className="flex gap-[3px]">
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayOfWeek) => {
                  const day = heatmapData.find(
                    (d) =>
                      d.weekIndex === weekIndex && d.dayOfWeek === dayOfWeek
                  );

                  if (!day) return null;

                  const date = new Date(day.date);
                  const isToday =
                    day.date === new Date().toISOString().split("T")[0];
                  const isFuture = date > new Date();

                  return (
                    <div
                      key={`${weekIndex}-${dayOfWeek}`}
                      className={`
                        w-[11px] h-[11px] rounded-[2px] transition-all
                        ${isFuture ? "bg-gray-50" : getColorClass(day.count)}
                        ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                        hover:ring-2 hover:ring-gray-400 hover:ring-offset-1
                        cursor-pointer
                      `}
                      title={`${day.date}: ${day.count}件の投稿`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-500">
          <span>少</span>
          <div className="flex gap-[3px]">
            <div className="w-[11px] h-[11px] rounded-[2px] bg-gray-100" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-green-200" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-green-300" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-green-400" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-green-500" />
          </div>
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
