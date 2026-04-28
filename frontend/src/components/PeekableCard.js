/**
 * PeekableCard Component
 * 
 * Wraps UserCard to add Peek functionality for:
 * - Here Now venue cards
 * - Not Here discovery cards
 * - Mutual Connection cards (longer peek for premium)
 * 
 * DOES NOT MODIFY:
 * - Blur logic
 * - Reveal logic
 * - Any existing card behavior
 * 
 * Peek is a brief visual glimpse only.
 */

import { useState, useCallback } from "react";
import { UserCard } from "./UserCard";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

// Configure axios defaults
axios.defaults.withCredentials = true;
if (typeof window !== 'undefined') {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

// Peek durations (in milliseconds)
const REGULAR_PEEK_DURATION = 200; // 0.15-0.25s -> 200ms
const MUTUAL_PEEK_DURATION_FREE = 250; // 0.2-0.3s -> 250ms
const MUTUAL_PEEK_DURATION_PREMIUM = 750; // 0.5-1.0s -> 750ms

export const PeekableCard = ({
  user,
  peekStatus, // { can_peek, can_mutual_peek, has_peeked, show_border, show_as }
  isMutualConnection = false,
  viewerIsPremium = false,
  onPeekComplete,
  // All other UserCard props passed through
  ...cardProps
}) => {
  const [isPeeking, setIsPeeking] = useState(false);
  const [hasPeekedLocal, setHasPeekedLocal] = useState(peekStatus?.has_peeked || false);
  const [hasMutualPeekedLocal, setHasMutualPeekedLocal] = useState(peekStatus?.has_mutual_peeked || false);
  
  // Determine if card should show gender border (peekable state)
  const showBorder = peekStatus?.can_peek && peekStatus?.allow_peek && !hasPeekedLocal;
  const showMutualBorder = isMutualConnection && peekStatus?.can_mutual_peek && !hasMutualPeekedLocal;
  
  // Get border color based on gender
  const getBorderColor = () => {
    if (!showBorder && !showMutualBorder) return "transparent";
    const gender = user?.show_as || peekStatus?.show_as;
    if (gender === "female") return "#FF2D8D"; // Pink
    if (gender === "male") return "#3A7BFF"; // Blue
    return "#8B5CF6"; // Purple fallback
  };
  
  // Handle card tap
  const handleCardClick = useCallback(async (e) => {
    // If currently peeking, ignore clicks
    if (isPeeking) {
      e.stopPropagation();
      return;
    }
    
    // Determine if this is a peek or navigate action
    const canRegularPeek = showBorder && !hasPeekedLocal;
    const canMutualPeek = showMutualBorder && !hasMutualPeekedLocal;
    
    if (canRegularPeek || canMutualPeek) {
      // First tap = Peek
      e.stopPropagation();
      e.preventDefault();
      
      try {
        // Record peek on backend
        const endpoint = canMutualPeek 
          ? `${API}/api/peek/mutual/${user.id}`
          : `${API}/api/peek/${user.id}`;
        
        await axios.post(endpoint);
        
        // Determine peek duration
        let duration = REGULAR_PEEK_DURATION;
        if (canMutualPeek) {
          duration = viewerIsPremium ? MUTUAL_PEEK_DURATION_PREMIUM : MUTUAL_PEEK_DURATION_FREE;
        }
        
        // Start peek animation
        setIsPeeking(true);
        
        // End peek after duration
        setTimeout(() => {
          setIsPeeking(false);
          if (canMutualPeek) {
            setHasMutualPeekedLocal(true);
          } else {
            setHasPeekedLocal(true);
          }
          onPeekComplete?.(user.id, canMutualPeek);
        }, duration);
        
      } catch (error) {
        console.error("Peek failed:", error);
        // If peek already used, update local state
        if (error.response?.status === 400) {
          if (canMutualPeek) {
            setHasMutualPeekedLocal(true);
          } else {
            setHasPeekedLocal(true);
          }
        }
      }
    }
    // If not peekable, let the click propagate to UserCard's onClick (profile navigation)
  }, [isPeeking, showBorder, showMutualBorder, hasPeekedLocal, hasMutualPeekedLocal, user?.id, viewerIsPremium, onPeekComplete]);
  
  // Border style for peekable state
  const borderStyle = (showBorder || showMutualBorder) ? {
    boxShadow: `0 0 0 3px ${getBorderColor()}`,
    transition: "box-shadow 0.3s ease"
  } : {};
  
  // During peek: temporarily remove blur by adding a class
  // The actual unblur is handled via CSS transform on the image
  const peekClass = isPeeking ? "peeking" : "";
  
  return (
    <div 
      className={`peekable-card-wrapper ${peekClass}`}
      style={borderStyle}
      onClick={handleCardClick}
    >
      <UserCard
        user={user}
        {...cardProps}
        // Override photo state during peek to show clear
        _isPeeking={isPeeking}
      />
      
      {/* CSS for peek animation */}
      <style>{`
        .peekable-card-wrapper {
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }
        
        .peekable-card-wrapper.peeking img {
          filter: none !important;
          transform: scale(1) !important;
          transition: filter 0.1s ease-out, transform 0.1s ease-out;
        }
        
        .peekable-card-wrapper:not(.peeking) img {
          transition: filter 0.15s ease-in, transform 0.15s ease-in;
        }
      `}</style>
    </div>
  );
};

export default PeekableCard;
