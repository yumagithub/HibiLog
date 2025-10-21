"use client"

import { useState } from "react"

export default function CalendarPage() {
  // 現在の月を取得
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0=1月, 11=12月

  // 月の初日と末日を計算
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)

  // 曜日（表示用）
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

  // 日付を配列にする
  const days = []
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i)
  }

  // 前月・次月の切り替え
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {currentYear}年 {currentMonth + 1}月
      </h1>

      {/* 月の切り替えボタン */}
      <div className="flex justify-between mb-4">
        <button onClick={prevMonth} className="px-3 py-1 bg-gray-200 rounded">
          ← 前の月
        </button>
        <button onClick={nextMonth} className="px-3 py-1 bg-gray-200 rounded">
          次の月 →
        </button>
      </div>

      {/* 曜日 */}
      <div className="grid grid-cols-7 text-center font-semibold mb-2">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* 日付 */}
      <div className="grid grid-cols-7 text-center gap-1">
        {Array(firstDay.getDay())
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
        {days.map((day) => (
          <div
            key={day}
            className="p-2 border rounded hover:bg-blue-100 cursor-pointer"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  </div>
  )
}
