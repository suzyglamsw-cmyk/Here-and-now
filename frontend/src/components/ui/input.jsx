import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-[16px] px-5 py-3 text-base transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
Input.displayName = "Input"

export { Input }
