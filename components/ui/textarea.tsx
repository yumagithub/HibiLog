import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "clay-input", // Base claymorphism style
        "flex min-h-20 w-full px-3 py-2 text-base md:text-sm", // Sizing and typography
        "disabled:cursor-not-allowed disabled:opacity-50", // Disabled state
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50", // Invalid state
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
