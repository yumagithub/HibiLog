import { create } from "zustand"
import { persist } from "zustand/middleware"

type BakuStatus = "healthy" | "normal" | "hungry" | "critical"

interface Memory {
  id: string
  imageUrl: string
  timestamp: string
}

type View = "upload" | "memories" | "settings"

interface BakuStore {
  hunger: number
  lastFed: string | null
  status: BakuStatus
  memories: Memory[]
  notificationsEnabled: boolean
  notificationInterval: number
  activeView: View

  feedBaku: () => void
  addMemory: (memory: Memory) => void
  updateHunger: () => void
  toggleNotifications: () => void
  setNotificationInterval: (interval: number) => void
  setActiveView: (view: View) => void
}

const calculateStatus = (hunger: number): BakuStatus => {
  if (hunger >= 75) return "healthy"
  if (hunger >= 50) return "normal"
  if (hunger >= 25) return "hungry"
  return "critical"
}

export const useBakuStore = create<BakuStore>()(
  persist(
    (set, get) => ({
      hunger: 100,
      lastFed: null,
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
      activeView: "upload",

      feedBaku: () => {
        set({
          hunger: 100,
          lastFed: new Date().toISOString(),
          status: "healthy",
        })
      },

      addMemory: (memory) => {
        set((state) => ({
          memories: [memory, ...state.memories],
        }))
      },

      updateHunger: () => {
        const { lastFed, notificationInterval } = get()
        if (!lastFed) return

        const hoursSinceLastFed = (Date.now() - new Date(lastFed).getTime()) / (1000 * 60 * 60)
        const hungerDecrease = (hoursSinceLastFed / notificationInterval) * 100
        const newHunger = Math.max(0, 100 - hungerDecrease)

        set({
          hunger: Math.round(newHunger),
          status: calculateStatus(newHunger),
        })
      },

      toggleNotifications: () => {
        set((state) => ({
          notificationsEnabled: !state.notificationsEnabled,
        }))
      },

      setNotificationInterval: (interval) => {
        set({ notificationInterval: interval })
      },

      setActiveView: (view) => {
        set({ activeView: view })
      },
    }),
    {
      name: "hibilog-storage",
    },
  ),
)
