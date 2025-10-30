import { create } from "zustand";
import { persist } from "zustand/middleware";

type BakuStatus = "healthy" | "normal" | "hungry" | "critical";

interface Memory {
  id: string;
  imageUrl: string;
  timestamp: string;
}

export type ActiveView = "upload" | "memories" | "settings";

type View = "upload" | "memories" | "settings";

interface BakuStore {
  hunger: number;
  lastFed: string | null;
  status: BakuStatus;
  memories: Memory[];
  notificationsEnabled: boolean;
  notificationInterval: number;
  activeView: View;

  feedBaku: (moodCategory?: string, hasText?: boolean) => void;
  addMemory: (memory: Memory) => void;
  updateHunger: () => void;
  setHunger: (hunger: number) => void;
  setLastFed: (lastFed: string) => void;
  toggleNotifications: () => void;
  setNotificationInterval: (interval: number) => void;
  setActiveView: (view: View) => void;
}

const calculateStatus = (hunger: number): BakuStatus => {
  if (hunger >= 75) return "healthy";
  if (hunger >= 50) return "normal";
  if (hunger >= 25) return "hungry";
  return "critical";
};

// 投稿の質による回復量を計算
const calculateRecoveryAmount = (
  moodCategory?: string,
  hasText?: boolean
): number => {
  let recovery = 25; // 基本回復量（1枚で25%）

  // ムードによる差はなくし、正直な感情入力を促進
  // すべての感情で同じ回復量

  // テキストありボーナス（振り返りを促進）
  if (hasText) {
    recovery += 5; // +5% → 合計30%
  }

  return recovery;
};

// 時間経過による満腹度減少を計算（24時間で40%減少）
const calculateHungerDecrease = (hoursSinceLastFed: number): number => {
  // 1時間あたり約1.67%減少（24時間で40%）
  const decreasePerHour = 40 / 24;
  return hoursSinceLastFed * decreasePerHour;
};

export const useBakuStore = create<BakuStore>()(
  persist(
    (set, get) => ({
      hunger: 100,
      lastFed: new Date().toISOString(), // 初期値として現在時刻を設定
      status: "healthy",
      memories: [
        {
          id: "dummy-1",
          imageUrl: "/figure1.png",
          timestamp: new Date("2025-10-13T12:00:00").toISOString(),
        },
        {
          id: "dummy-2",
          imageUrl: "/figure2.png",
          timestamp: new Date("2025-10-14T09:00:00").toISOString(),
        },
      ],
      notificationsEnabled: false,
      notificationInterval: 6,
      activeView: "memories", // デフォルトは思い出タブ

      feedBaku: (moodCategory?: string, hasText?: boolean) => {
        const currentHunger = get().hunger;
        const recoveryAmount = calculateRecoveryAmount(moodCategory, hasText);
        const newHunger = Math.min(100, currentHunger + recoveryAmount);

        set({
          hunger: newHunger,
          lastFed: new Date().toISOString(),
          status: calculateStatus(newHunger),
        });
      },

      addMemory: (memory) => {
        set((state) => ({
          memories: [memory, ...state.memories],
        }));
      },

      updateHunger: () => {
        const { lastFed } = get();
        if (!lastFed) {
          // lastFedがない場合は現在時刻を設定
          set({ lastFed: new Date().toISOString() });
          return;
        }

        const now = Date.now();
        const lastFedTime = new Date(lastFed).getTime();
        const hoursSinceLastFed = (now - lastFedTime) / (1000 * 60 * 60);

        // 24時間で25%減少
        const hungerDecrease = calculateHungerDecrease(hoursSinceLastFed);
        const newHunger = Math.max(0, 100 - hungerDecrease);

        set({
          hunger: Math.round(newHunger * 10) / 10, // 小数点第1位まで
          status: calculateStatus(newHunger),
        });
      },

      setHunger: (hunger) => {
        set({
          hunger,
          status: calculateStatus(hunger),
        });
      },

      setLastFed: (lastFed) => {
        set({ lastFed });
      },

      toggleNotifications: () => {
        set((state) => ({
          notificationsEnabled: !state.notificationsEnabled,
        }));
      },

      setNotificationInterval: (interval) => {
        set({ notificationInterval: interval });
      },

      setActiveView: (view) => {
        set({ activeView: view });
      },
    }),
    {
      name: "hibilog-storage",
    }
  )
);
