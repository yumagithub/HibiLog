// components/ui/calendar.tsx
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  className?: string;
};

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn(
        "p-2 text-sm",
        "[&_.rdp-caption_label]:font-medium",
        "[&_.rdp-head_cell]:text-[11px] [&_.rdp-head_cell]:font-normal",
        "[&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day]:rounded-full",

        // 선택된 날짜 색상
        "[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground",

        // 오늘 날짜 강조 (여기 추가됨)
        "[&_.rdp-day_today]:border [&_.rdp-day_today]:border-primary",
        "[&_.rdp-day_today]:bg-amber-200 [&_.rdp-day_today]:text-amber-900",

        /* 주말 색상 설정 */
        "[&_.rdp-day[data-weekday='6']]:text-blue-600", // 토요일
        "[&_.rdp-day[data-weekday='0']]:text-red-600", // 일요일

        className
      )}
      {...props}
    />
  );
}
