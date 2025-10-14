"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useBakuStore } from "@/lib/store"
import { Bell } from "lucide-react"

const intervals = [
  { value: 3, label: "3時間おき" },
  { value: 6, label: "6時間おき" },
  { value: 12, label: "12時間おき" },
  { value: 24, label: "24時間おき" },
]

export function SettingsTab() {
  const { notificationsEnabled, notificationInterval, toggleNotifications, setNotificationInterval } = useBakuStore()

  return (
    <Card className="p-6 space-y-6">
      {/* Notifications Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="notifications" className="text-base font-medium">
            通知
          </Label>
          <p className="text-sm text-muted-foreground">バクが空腹になったら通知します</p>
        </div>
        <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
      </div>

      {/* Notification Interval */}
      {notificationsEnabled && (
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-medium">通知間隔</Label>
          <div className="grid grid-cols-2 gap-3">
            {intervals.map((interval) => (
              <Button
                key={interval.value}
                variant={notificationInterval === interval.value ? "default" : "outline"}
                onClick={() => setNotificationInterval(interval.value)}
                className="h-auto py-3"
              >
                <Bell className="h-4 w-4 mr-2" />
                {interval.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="pt-4 border-t">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">バクについて</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            バクは思い出を食べる不思議な生き物です。定期的に写真をアップロードして、バクを元気に保ちましょう。
          </p>
        </div>
      </div>
    </Card>
  )
}
