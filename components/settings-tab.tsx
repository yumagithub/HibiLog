"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBakuStore } from "@/lib/store";
import { Bell, Check, UserCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const intervals = [
  { value: 3, label: "3時間おき" },
  { value: 6, label: "6時間おき" },
  { value: 12, label: "12時間おき" },
  { value: 24, label: "24時間おき" },
];

export function SettingsTab({ user }: { user: User }) {
  const {
    notificationsEnabled,
    notificationInterval,
    toggleNotifications,
    setNotificationInterval,
  } = useBakuStore();
  const router = useRouter();

  // ユーザーが匿名（ゲスト）かどうか確認
  const isAnonymous = user.is_anonymous || false;

  return (
    <Card className="p-6 space-y-6">
      {/* ゲストユーザー向けアップグレード通知 */}
      {isAnonymous && (
        <Alert className="border-blue-200 bg-blue-50">
          <UserPlus className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <p className="font-medium mb-2">ゲストモードで利用中です</p>
            <p className="text-xs mb-3">
              アカウント登録すると、データを永続的に保存できます。
            </p>
            <Button
              size="sm"
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              アカウント登録
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="notifications" className="text-base font-medium">
            通知
          </Label>
          <p className="text-sm text-muted-foreground">
            バクが空腹になったら通知します
          </p>
        </div>
        <Switch
          id="notifications"
          checked={notificationsEnabled}
          onCheckedChange={toggleNotifications}
        />
      </div>

      {/* Notification Interval */}
      {notificationsEnabled && (
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-medium">通知間隔</Label>
          <div className="grid grid-cols-2 gap-3">
            {intervals.map((interval) => {
              const isSelected = notificationInterval === interval.value;
              return (
                <Button
                  key={interval.value}
                  variant="default"
                  onClick={() => setNotificationInterval(interval.value)}
                  className={cn(
                    "h-auto py-3 transition-all duration-200 relative",
                    isSelected
                      ? "scale-105 shadow-lg ring-2 ring-primary/30"
                      : "opacity-50 scale-95 hover:opacity-70 hover:scale-100"
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  {interval.label}
                </Button>
              );
            })}
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

      {/* Account Link */}
      {user && (
        <div className="pt-4 border-t">
          <Button
            onClick={() => router.push("/account")}
            className="w-full clay-button flex items-center justify-center gap-2"
          >
            <UserCircle className="h-5 w-5" />
            アカウント情報
          </Button>
        </div>
      )}
    </Card>
  );
}
