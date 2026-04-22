const ClockO = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle (the O) */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Hour hand pointing to 8 (240 degrees from 12) */}
      <line
        x1="12"
        y1="12"
        x2="7.5"
        y2="15.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Minute hand pointing to 12 */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
};

export const Logo = ({ size = "default", showText = true }) => {
  const sizeClasses = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl",
    hero: "text-4xl md:text-5xl",
  };

  const clockSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
    hero: "w-8 h-8 md:w-10 md:h-10",
  };

  const shimmerStyle = {
    backgroundImage: 'linear-gradient(90deg, #a855f7, #c084fc, #ec4899, #c084fc, #a855f7)',
    backgroundSize: '200% 100%',
    animation: 'shimmerText 4s ease-in-out infinite',
  };

  return (
    <div className="flex items-center gap-1">
      <style>{`
        @keyframes shimmerText {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
      `}</style>
      {showText && (
        <span 
          className={`font-bold tracking-tight bg-clip-text text-transparent ${sizeClasses[size]}`}
          style={shimmerStyle}
        >
          Here & N
        </span>
      )}
      <ClockO className={`${clockSizes[size]} text-purple-400`} />
      {showText && (
        <span 
          className={`font-bold tracking-tight bg-clip-text text-transparent ${sizeClasses[size]}`}
          style={shimmerStyle}
        >
          w
        </span>
      )}
    </div>
  );
};

export const LogoIcon = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center ${className}`}>
      <ClockO className="w-5 h-5 text-white" />
    </div>
  );
};

export default Logo;
