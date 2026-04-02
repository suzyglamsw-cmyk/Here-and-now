import * as React from "react"

const Textarea = React.forwardRef(({ className, style, ...props }, ref) => {
  return (
    <div
      style={{
        display: 'block',
        width: '100%',
        padding: '0',
        borderRadius: '20px',
        border: '2px solid #FFFFFF',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <textarea
        ref={ref}
        style={{
          display: 'block',
          width: '100%',
          minHeight: '120px',
          padding: '20px 24px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          outline: 'none',
          resize: 'none',
          ...style
        }}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = "Textarea"

export { Textarea }
