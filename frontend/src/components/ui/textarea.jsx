import * as React from "react"

const Textarea = React.forwardRef(({ className, style, ...props }, ref) => {
  const baseStyles = {
    display: 'flex',
    width: '100%',
    minHeight: '120px',
    padding: '20px 24px',
    borderRadius: '20px',
    background: 'rgba(231, 217, 255, 0.24)',
    border: '2px solid #E7D9FF',
    boxShadow: '0 0 24px rgba(231, 217, 255, 0.22), inset 0 2px 4px rgba(0, 0, 0, 0.15)',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    resize: 'none',
    transition: 'all 0.3s ease',
  };

  const handleFocus = (e) => {
    e.target.style.boxShadow = '0 0 32px rgba(231, 217, 255, 0.35), 0 0 0 3px rgba(231, 217, 255, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.15)';
    e.target.style.borderColor = '#FFFFFF';
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    e.target.style.boxShadow = '0 0 24px rgba(231, 217, 255, 0.22), inset 0 2px 4px rgba(0, 0, 0, 0.15)';
    e.target.style.borderColor = '#E7D9FF';
    props.onBlur?.(e);
  };

  return (
    <textarea
      ref={ref}
      style={{ ...baseStyles, ...style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea"

export { Textarea }
