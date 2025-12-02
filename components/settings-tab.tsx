"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBakuStore } from "@/lib/store";
import {
  Bell,
  Check,
  UserCircle,
  UserPlus,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from "@/app/actions";

const intervals = [
  { value: 3, label: "3時間おき" },
  { value: 6, label: "6時間おき" },
  { value: 12, label: "12時間おき" },
  { value: 24, label: "24時間おき" },
];

// VAPIDキーをUint8Arrayに変換するヘルパー関数
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function SettingsTab({ user }: { user: User | null }) {
  const {
    notificationsEnabled,
    notificationInterval,
    toggleNotifications,
    setNotificationInterval,
  } = useBakuStore();
  const router = useRouter();

  const [isPushSupported, setIsPushSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // 1. コンポーネントマウント時にPush APIのサポート状況と現在の購読状態を確認
  useEffect(() => {
    async function checkPushSupport() {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      ) {
        setIsPushSupported(true);

        try {
          const registration = await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.getSubscription();

          if (sub) {
            setSubscription(sub);
            // Zustandの状態と同期する
            if (!notificationsEnabled) {
              useBakuStore.getState().toggleNotifications();
            }
          }
        } catch (error) {
          console.error("Failed to check push subscription:", error);
        }
      }
    }

    checkPushSupport();
  }, [notificationsEnabled]);

  // 通知トグルのハンドラー
  const handleNotificationToggle = async () => {
    if (!isPushSupported || !user) return;

    if (!notificationsEnabled) {
      // オンにする場合：購読処理を実行
      await handleSubscribe();
    } else {
      // オフにする場合：購読解除を実行
      await handleUnsubscribe();
      // Zustandの状態を更新
      toggleNotifications();
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      // VAPID公開鍵の確認
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError(
          "通知機能の設定が完了していません。管理者にお問い合わせください。"
        );
        return;
      }

      // ブラウザの通知権限をリクエスト
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          "通知権限が拒否されました。ブラウザの設定から通知を許可してください。"
        );
        return;
      }

      // Service Workerの準備を待つ
      const registration = await navigator.serviceWorker.ready;

      // 既存の購読を確認
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.log("Already subscribed, using existing subscription");
        setSubscription(existingSub);
        await subscribeUser(existingSub.toJSON(), user.id);
        toggleNotifications();
        return;
      }

      // 新規購読
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub, user.id);
      setSubscription(sub);
      setError(null);
      toggleNotifications();
      console.log("Successfully subscribed to push notifications");
    } catch (err) {
      console.error("Failed to subscribe:", err);
      setError(
        "通知の購読に失敗しました。ブラウザの通知設定を確認してください。"
      );
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription || !user) return;
    try {
      await subscription.unsubscribe();
      await unsubscribeUser(user.id);
      setSubscription(null);
      setError(null);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      setError("通知の購読解除に失敗しました。");
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    try {
      const result = await sendNotification(user.id, {
        title: "テスト通知",
        body: "バクがお腹を空かせています!🍽️",
        icon: "/icon-192x192.png",
      });
      if (!result.success) {
        setError("通知の送信に失敗しました: " + result.error);
      }
    } catch (err) {
      console.error("Failed to send test notification:", err);
      setError("通知の送信に失敗しました。");
    }
  };

  const isGuest = !user;

  return (
    <Card className="p-6 space-y-6">
      {/* ゲストユーザー向けアップグレード通知 */}
      {isGuest && (
        <Alert className="border-blue-200 bg-blue-50">
          <UserPlus className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <p className="font-medium mb-2">ゲストモードで利用中です</p>
            <p className="text-xs mb-3">
              アカウント登録すると、データをクラウドに同期できます。
            </p>
            <Button
              size="sm"
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              アカウント登録して同期
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notifications" className="text-base font-medium">
              プッシュ通知
            </Label>
            <p className="text-sm text-muted-foreground">
              バクが空腹になったら通知します
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
            disabled={!isPushSupported || isGuest}
          />
        </div>
        {!isPushSupported && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              お使いのブラウザはプッシュ通知に対応していません。
            </AlertDescription>
          </Alert>
        )}
        {isGuest && notificationsEnabled && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              通知機能を利用するにはアカウント登録が必要です。
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Notification Interval */}
      {notificationsEnabled && !isGuest && (
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

          {/* Test Notification Button */}
          <Button
            onClick={handleTestNotification}
            variant="outline"
            className="w-full mt-3"
          >
            <Bell className="h-4 w-4 mr-2" />
            テスト通知を送信
          </Button>
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
        <div className="pt-4 border-t space-y-3">
          <Button
            onClick={() => router.push("/stats")}
            className="w-full clay-button flex items-center justify-center gap-2 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <BarChart3 className="h-5 w-5" />
            統計情報を見る
          </Button>
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
