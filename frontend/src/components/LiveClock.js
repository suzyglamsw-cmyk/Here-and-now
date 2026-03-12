import { useState, useEffect } from "react";

const LiveClock = ({ className = "" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();

  // Calculate hand angles
  // Hour hand: 360/12 = 30 degrees per hour, plus minutes contribution
  const hourAngle = (hours * 30) + (minutes * 0.5);
  // Minute hand: 360/60 = 6 degrees per minute
  const minuteAngle = minutes * 6;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Clock face - outer ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          fill="rgba(15,23,42,0.5)"
        />
        
        {/* Inner ring for depth */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          fill="none"
        />

        {/* Hour hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="25"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 50 50)`}
        />

        {/* Minute hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="rgba(99,102,241,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
        />

        {/* Center dot */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="white"
        />
        <circle
          cx="50"
          cy="50"
          r="2"
          fill="rgb(99,102,241)"
        />
      </svg>
    </div>
  );
};

export default LiveClock;
