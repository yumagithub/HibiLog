import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "clay-input", // Base claymorphism style
        "h-9 w-full min-w-0 px-3 py-1 text-base md:text-sm", // Sizing and typography
        "selection:bg-primary selection:text-primary-foreground", // Text selection color
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", // Disabled state
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50", // Invalid state
        className
      )}
      {...props}
    />
  )
}

export { Input }
