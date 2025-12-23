// app/stats/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, Heart, Flame } from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  calculateStats,
  MOOD_COLORS,
  MOOD_LABELS,
  type StatsData,
} from "@/lib/stats-calculator";
import type { Memory } from "@/components/memory/memories-tab";
import { MemoryHeatmap } from "@/components/memory/memory-heatmap";

export default function StatsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // ゲストモードの場合
      if (!session?.user) {
        // ゲストユーザーの統計を取得
        await fetchGuestStats();
        setLoading(false);
        return;
      }

      setUser(session.user);
      await fetchStats(session.user.id);
      setLoading(false);
    };
    checkUser();
  }, [supabase, router]);

  const fetchGuestStats = async () => {
    try {
      // 現在のセッションからゲストユーザーIDを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // セッションがない場合は空のデータ
      if (!session?.user) {
        console.log("セッションなし - 空の統計を表示");
        setStats(calculateStats([]));
        setMemories([]);
        return;
      }

      // ゲストユーザーのデータを取得（user_idで検索）
      const { data: memories, error } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("memory_date", { ascending: true });

      if (error) {
        console.error("Supabaseエラー:", error);
        throw error;
      }

      console.log("取得したゲストメモリー:", memories);

      if (!memories || memories.length === 0) {
        console.log("ゲストのデータが0件です");
        setStats(calculateStats([]));
        setMemories([]);
        return;
      }

      // 感情スコアの平均を計算
      const emotionScores = memories
        .map((m: any) => m.emotion_score)
        .filter(
          (score): score is number => score !== null && score !== undefined
        );
      const avgEmotionScore =
        emotionScores.length > 0
          ? emotionScores.reduce((sum, score) => sum + score, 0) /
            emotionScores.length
          : null;

      // 統計データを計算
      const calculatedStats = calculateStats(memories as Memory[]);
      setStats({ ...calculatedStats, avgEmotionScore } as any);
      setMemories(memories as Memory[]);
      console.log("ユーザー統計: メモリーデータ", memories.length, "件");
      console.log(
        "最初の3件:",
        memories
          .slice(0, 3)
          .map((m: any) => ({ date: m.memory_date, text: m.text_content }))
      );
    } catch (error) {
      console.error("統計データの取得エラー:", error);
      console.error("エラー詳細:", JSON.stringify(error, null, 2));
      // エラーが発生しても空のデータで統計を表示
      setStats(calculateStats([]));
      setMemories([]);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      // 思い出データを取得
      const { data: memories, error } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", userId)
        .order("memory_date", { ascending: true });

      if (error) throw error;

      if (!memories || memories.length === 0) {
        setStats(calculateStats([]));
        setMemories([]);
        return;
      }

      // 感情スコアの平均を計算
      const emotionScores = memories
        .map((m: any) => m.emotion_score)
        .filter(
          (score): score is number => score !== null && score !== undefined
        );
      const avgEmotionScore =
        emotionScores.length > 0
          ? emotionScores.reduce((sum, score) => sum + score, 0) /
            emotionScores.length
          : null;

      // 統計データを計算
      const calculatedStats = calculateStats(memories as Memory[]);
      setStats({ ...calculatedStats, avgEmotionScore } as any);
      setMemories(memories as Memory[]);
      console.log("ユーザー統計: メモリーデータ", memories.length, "件");
      console.log(
        "最初の3件:",
        memories
          .slice(0, 3)
          .map((m: any) => ({ date: m.memory_date, text: m.text_content }))
      );
    } catch (error) {
      console.error("統計データの取得エラー:", error);
      setStats(calculateStats([]));
      setMemories([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // 感情の分布データをグラフ用に変換
  const moodChartData = Object.entries(stats.moodDistribution).map(
    ([key, value]) => ({
      name: MOOD_LABELS[key] || key,
      value,
      color: MOOD_COLORS[key] || MOOD_COLORS.unknown,
    })
  );

  // カスタムツールチップコンポーネント
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.month}
          </p>
          <p className="text-sm text-gray-600">記録数: {payload[0].value}件</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].value}件</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              📊 あなたの振り返り統計
            </h1>
            <p className="text-xs text-gray-500">
              思い出を可視化して、自分を知ろう
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ - 2カラムレイアウト */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左カラム（2/3幅） */}
          <div className="lg:col-span-2 space-y-4">
            {/* サマリーカード */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3"
            >
              {/* 総思い出数 */}
              <Card className="p-4 text-center space-y-1 bg-white/80 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalMemories}
                </div>
                <div className="text-xs text-gray-600">思い出の数</div>
                <TrendingUp className="h-5 w-5 mx-auto text-blue-400" />
              </Card>

              {/* 連続記録日数 */}
              <Card className="p-4 text-center space-y-1 bg-white/80 backdrop-blur-sm">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.currentStreak}
                </div>
                <div className="text-xs text-gray-600">日連続</div>
                <Flame className="h-5 w-5 mx-auto text-orange-400" />
              </Card>

              {/* 利用日数 */}
              <Card className="p-4 text-center space-y-1 bg-white/80 backdrop-blur-sm">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.daysSinceStart}
                </div>
                <div className="text-xs text-gray-600">日経過</div>
                <Calendar className="h-5 w-5 mx-auto text-purple-400" />
              </Card>

              {/* 最長連続記録 */}
              <Card className="p-4 text-center space-y-1 bg-white/80 backdrop-blur-sm">
                <div className="text-3xl font-bold text-pink-600">
                  {stats.longestStreak}
                </div>
                <div className="text-xs text-gray-600">最長記録</div>
                <Heart className="h-5 w-5 mx-auto text-pink-400" />
              </Card>

              {/* 感情スコア平均 */}
              {(stats as any).avgEmotionScore !== null &&
                (stats as any).avgEmotionScore !== undefined && (
                  <Card className="p-4 text-center space-y-1 bg-white/80 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-green-600">
                      {((stats as any).avgEmotionScore as number).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">感情スコア平均</div>
                    <TrendingUp className="h-5 w-5 mx-auto text-green-400" />
                  </Card>
                )}
            </motion.div>

            {/* 月別投稿数 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-4 bg-white/80 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  📅 月別の記録数
                </h2>
                {stats.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    データがありません
                  </div>
                )}
              </Card>
            </motion.div>

            {/* ヒートマップ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-4 bg-white/80 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  🔥 投稿ヒートマップ
                </h2>
                {memories.length > 0 ? (
                  <div className="overflow-x-auto">
                    <MemoryHeatmap memories={memories} weeks={52} />
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                    データがありません
                  </div>
                )}
              </Card>
            </motion.div>

            {/* 感情スコアの推移 */}
            {memories.some(
              (m: any) =>
                m.emotion_score !== null && m.emotion_score !== undefined
            ) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="p-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      📈 感情スコアの推移
                    </h2>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-sm border rounded-lg px-3 py-1 bg-white"
                    >
                      {(() => {
                        const months = new Set<string>();
                        memories.forEach((m: any) => {
                          if (
                            m.emotion_score !== null &&
                            m.emotion_score !== undefined
                          ) {
                            const date = new Date(m.memory_date);
                            const monthKey = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;
                            months.add(monthKey);
                          }
                        });
                        return Array.from(months)
                          .sort()
                          .reverse()
                          .map((month) => {
                            const [year, m] = month.split("-");
                            return (
                              <option key={month} value={month}>
                                {year}年{m}月
                              </option>
                            );
                          });
                      })()}
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={(() => {
                        // 選択された月のデータをフィルタ
                        const filteredMemories = memories.filter((m: any) => {
                          if (
                            m.emotion_score === null ||
                            m.emotion_score === undefined
                          )
                            return false;
                          const date = new Date(m.memory_date);
                          const monthKey = `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, "0")}`;
                          return monthKey === selectedMonth;
                        });

                        // 日付ごとにグループ化して平均を計算
                        const dailyScores: { [key: string]: number[] } = {};
                        filteredMemories.forEach((m: any) => {
                          const dateKey = m.memory_date;
                          if (!dailyScores[dateKey]) {
                            dailyScores[dateKey] = [];
                          }
                          dailyScores[dateKey].push(m.emotion_score);
                        });

                        // 平均を計算してソート
                        return Object.entries(dailyScores)
                          .map(([date, scores]) => ({
                            date: new Date(date).toLocaleDateString("ja-JP", {
                              month: "short",
                              day: "numeric",
                            }),
                            fullDate: date,
                            score:
                              scores.reduce((sum, s) => sum + s, 0) /
                              scores.length,
                            count: scores.length,
                          }))
                          .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="#6b7280"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/95 border border-gray-200 rounded-lg p-2 shadow-lg">
                                <p className="text-xs font-semibold">
                                  {data.date}
                                </p>
                                <p className="text-xs text-green-600">
                                  平均スコア: {data.score.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  投稿数: {data.count}件
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}
          </div>

          {/* 右カラム（1/3幅） */}
          <div className="space-y-4">
            {/* 感情の分布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-4 bg-white/80 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  😊 感情の分布
                </h2>
                {moodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={moodChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {moodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    データがありません
                  </div>
                )}
              </Card>
            </motion.div>
            {/* 曜日別の傾向 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-4 bg-white/80 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  📊 曜日別の傾向
                </h2>
                {stats.weekdayData.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={stats.weekdayData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="dayShort"
                        tick={{ fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, "auto"]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="投稿数"
                        dataKey="count"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    データがありません
                  </div>
                )}
              </Card>
            </motion.div>

            {/* インサイト */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-4 bg-linear-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  💡 インサイト
                </h2>
                <div className="space-y-2 text-sm">
                  {stats.totalMemories === 0 ? (
                    <p className="text-gray-700">
                      📝
                      まだ思い出がありません。カメラで撮影して記録を始めましょう！
                    </p>
                  ) : (
                    <>
                      {stats.currentStreak >= 7 && (
                        <p className="text-gray-700">
                          🔥 素晴らしい！{stats.currentStreak}
                          日連続で記録しています！
                        </p>
                      )}
                      {stats.currentStreak >= 30 && (
                        <p className="text-gray-700">
                          ⭐ 30日以上の連続記録達成！習慣化できています！
                        </p>
                      )}
                      {stats.totalMemories >= 100 && (
                        <p className="text-gray-700">
                          🎉 100個以上の思い出を記録しました！
                        </p>
                      )}
                      {stats.totalMemories < 10 && (
                        <p className="text-gray-700">
                          📝
                          まだ始めたばかりですね。続けて記録していきましょう！
                        </p>
                      )}
                      {getTopMood() && (
                        <p className="text-gray-700">
                          😊 最も多い感情は「{getTopMood()}」です
                        </p>
                      )}
                      {getTopWeekday() && (
                        <p className="text-gray-700">
                          📅 {getTopWeekday()}に記録することが多いですね
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );

  // ヘルパー関数
  function getTopMood() {
    if (moodChartData.length === 0) return null;
    const top = moodChartData.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );
    return top.name;
  }

  function getTopWeekday() {
    if (!stats || stats.weekdayData.length === 0) return null;
    const top = stats.weekdayData.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
    return top.count > 0 ? top.day : null;
  }
}
