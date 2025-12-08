"use client";

import { MonthlyHighlight }  from "./MonthlyHighlight";
import { X } from "lucide-react";

export default function HighlightModal( { onClose, userId }: { onClose: () => void; userId: string | null }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景ぼかし */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-11/12 max-w-md p-4 z-50 animate-fadeIn">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1"
        >
          <X size={24} />
        </button>
        <h1 className="text-center text-xl font-bold text-foreground mb-4">先月の思い出</h1>

        {/* 月のスライドショー */}
        <MonthlyHighlight userId={userId} />
      </div>
    </div>
  );
}
