"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Camera } from "lucide-react"
import { useBakuStore } from "@/lib/store"

export function UploadTab() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  // const { toast } = useToast()
  const { feedBaku, addMemory } = useBakuStore()

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        // toast({
        //   title: "エラー",
        //   description: "画像ファイルを選択してください",
        //   variant: "destructive",
        // })
        return
      }

      setIsUploading(true)

      try {
        // Create object URL for preview
        const imageUrl = URL.createObjectURL(file)

        // Add memory and feed Baku
        addMemory({
          id: Date.now().toString(),
          imageUrl,
          timestamp: new Date().toISOString(),
        })

        feedBaku()

        // toast({
        //   title: "成功！",
        //   description: "バクが美味しそうに思い出を食べました！",
        // })
      } catch (error) {
        // toast({
        //   title: "エラー",
        //   description: "アップロードに失敗しました",
        //   variant: "destructive",
        // })
      } finally {
        setIsUploading(false)
      }
    },
    [feedBaku, addMemory],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  return (
    <Card className="p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging ? "border-primary bg-primary/5 scale-105" : "border-border bg-muted/30"}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Camera className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">写真をアップロード</p>
            <p className="text-sm text-muted-foreground">ドラッグ＆ドロップまたはクリックして選択</p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />

          <Button asChild size="lg" className="mt-4" disabled={isUploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "アップロード中..." : "ファイルを選択"}
            </label>
          </Button>
        </div>
      </div>
    </Card>
  )
}
