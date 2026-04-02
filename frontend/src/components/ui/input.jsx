import * as React from "react"

const Input = React.forwardRef(({ className, type, style, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      style={{
        display: 'flex',
        width: '100%',
        height: '56px',
        padding: '16px 24px',
        borderRadius: '20px',
        background: 'rgba(231, 217, 255, 0.28)',
        border: '2px solid #FFFFFF',
        boxShadow: '0 0 24px rgba(231, 217, 255, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.12)',
        color: 'white',
        fontSize: '16px',
        outline: 'none',
        transition: 'all 0.3s ease',
        ...style
      }}
      {...props}
    />
  );
});

Input.displayName = "Input"

export { Input }
