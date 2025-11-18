// components/ui/calendar.tsx
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  modifiers,
  modifiersStyles,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      // ✅ dayOfWeek を使って土曜・日曜を判定
      modifiers={{
        saturday: { dayOfWeek: [6] }, // 土曜日
        sunday: { dayOfWeek: [0] },   // 日曜日
        ...(modifiers || {}),
      }}
      className={cn("p-2 text-sm", className)}
      classNames={{
        caption_label: cn("font-medium", classNames?.caption_label),
        head_cell: cn("text-[11px] font-normal", classNames?.head_cell),
        day: cn("h-8 w-8 rounded-full", classNames?.day),
        ...classNames,
      }}
      // ✅ weekend / today の色を modifiersStyles で指定
      modifiersStyles={{
        ...modifiersStyles,
        today: {
          ...(modifiersStyles?.today || {}),
          backgroundColor: "rgb(254 243 199)", // amber-200
          color: "rgb(120 53 15)",            // amber-900
          borderRadius: "9999px",
        },
        saturday: {
          ...(modifiersStyles?.saturday || {}),
          color: "rgb(37 99 235)",            // blue-600
        },
        sunday: {
          ...(modifiersStyles?.sunday || {}),
          color: "rgb(220 38 38)",            // red-600
        },
      }}
      {...props}
    />
  );
}
