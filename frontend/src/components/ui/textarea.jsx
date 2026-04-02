import * as React from "react"

const Textarea = React.forwardRef(({ className, style, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '120px',
        padding: '20px 24px',
        borderRadius: '20px',
        background: 'rgba(231, 217, 255, 0.28)',
        border: '2px solid #FFFFFF',
        boxShadow: '0 0 24px rgba(231, 217, 255, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.12)',
        color: 'white',
        fontSize: '16px',
        outline: 'none',
        resize: 'none',
        transition: 'all 0.3s ease',
        ...style
      }}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea"

export { Textarea }
