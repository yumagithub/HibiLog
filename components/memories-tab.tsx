"use client"

import { Card } from "@/components/ui/card"
import { useBakuStore } from "@/lib/store"
import { Calendar } from "lucide-react"

export function MemoriesTab() {
  const { memories } = useBakuStore()

  if (memories.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Calendar className="h-16 w-16 opacity-50" />
          <div>
            <p className="font-medium">まだ思い出がありません</p>
            <p className="text-sm mt-1">写真をアップロードして始めましょう</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {memories.map((memory) => (
        <Card key={memory.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
          <div className="aspect-square relative bg-muted">
            <img
              src={memory.imageUrl || "/placeholder.svg"}
              alt="Memory"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="p-3 bg-card">
            <p className="text-xs text-muted-foreground">
              {new Date(memory.timestamp).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
