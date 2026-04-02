import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[16px] px-5 py-4 text-base transition-all duration-300 placeholder:text-white/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
        className
      )}
      style={{
        background: 'rgba(231, 217, 255, 0.12)',
        border: '2px solid #F3E8FF',
        boxShadow: '0 0 20px rgba(231, 217, 255, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.06)',
        ...props.style
      }}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
