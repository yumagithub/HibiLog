"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 開発環境でもService Workerを登録（テスト用）
      navigator.serviceWorker
        .register("/service-worker.js?v=" + Date.now(), {
          scope: "/",
          updateViaCache: "none",
        })
        .then((registration) => {
          console.log("Service Worker registered:", registration);
          console.log("Service Worker scope:", registration.scope);

          // 定期的な更新チェック
          registration.update();
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
