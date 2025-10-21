"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BakuDisplay } from "@/components/baku-display"
import { UploadTab } from "@/components/upload-tab"
import { MemoriesTab } from "@/components/memories-tab"
import { SettingsTab } from "@/components/settings-tab"
import { Camera, ImageIcon, Settings } from "lucide-react"
import Link from "next/link"

export default function HibiLogApp() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">HibiLog</h1>
          <p className="text-sm text-muted-foreground">{"思い出を食べるバクを育てよう"}</p>
        </header>

        {/* Baku Character Display */}
        <BakuDisplay />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">投稿</span>
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">思い出</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadTab />
          </TabsContent>

          <TabsContent value="memories">
            <MemoriesTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>

    
  )
  
}

