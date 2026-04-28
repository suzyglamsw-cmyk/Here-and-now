/**
 * PeekableCard Component
 * 
 * Wraps UserCard to add Peek functionality for:
 * - Here Now venue cards
 * - Not Here discovery cards
 * 
 * DOES NOT MODIFY:
 * - Blur logic (BlurredImage.js, getBlurValue())
 * - Reveal logic
 * - Any existing card behavior
 * 
 * Peek is a brief visual glimpse only (0.15-0.25 seconds).
 * Controlled by target user's allow_peek setting.
 * 
 * Special case: hide_photo_in_venues = true (Here Now only)
 * - Shows silhouette as base image
 * - Peek flips the silhouette (not clear photo)
 */

import { useState, useCallback, useEffect } from "react";
import { UserCard } from "./UserCard";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

// Peek duration (in milliseconds): 0.15-0.25s -> 200ms
const PEEK_DURATION = 200;

export const PeekableCard = ({
  user,
  peekStatus, // { can_peek, has_peeked, show_border, allow_peek, show_as }
  onPeekComplete,
  context = "venue", // "venue" for Here Now, "not_here" for Not Here
  // All other UserCard props passed through
  ...cardProps
}) => {
  const [isPeeking, setIsPeeking] = useState(false);
  const [hasPeekedLocal, setHasPeekedLocal] = useState(peekStatus?.has_peeked || false);
  
  // Update local state when peekStatus changes (e.g., on refresh)
  useEffect(() => {
    setHasPeekedLocal(peekStatus?.has_peeked || false);
  }, [peekStatus?.has_peeked]);
  
  // Determine if peek is enabled for this target
  const allowPeek = peekStatus?.allow_peek !== false; // Default true if undefined
  
  // Determine if card should show gender border (peekable state)
  // Border shown only if: allow_peek=true AND can_peek=true (not already peeked)
  const showBorder = allowPeek && peekStatus?.can_peek && !hasPeekedLocal;
  
  // Get border color based on gender
  const getBorderColor = () => {
    if (!showBorder) return "transparent";
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
      e.preventDefault();
      return;
    }
    
    // If peek is not enabled or already peeked, let click propagate to UserCard
    if (!allowPeek || hasPeekedLocal || !peekStatus?.can_peek) {
      // Click will propagate to UserCard which handles navigation to profile
      return;
    }
    
    // First tap = Peek
    e.stopPropagation();
    e.preventDefault();
    
    try {
      // Record peek on backend
      await axios.post(`${API}/api/peek/${user.id}`);
      
      // Start peek animation
      setIsPeeking(true);
      
      // End peek after duration
      setTimeout(() => {
        setIsPeeking(false);
        setHasPeekedLocal(true);
        onPeekComplete?.(user.id);
      }, PEEK_DURATION);
      
    } catch (error) {
      console.error("Peek failed:", error);
      // If peek already used (400) or disabled (403), update local state
      if (error.response?.status === 400 || error.response?.status === 403) {
        setHasPeekedLocal(true);
      }
    }
  }, [isPeeking, allowPeek, hasPeekedLocal, peekStatus?.can_peek, user?.id, onPeekComplete]);
  
  // Border style for peekable state
  const borderStyle = showBorder ? {
    boxShadow: `0 0 0 3px ${getBorderColor()}`,
    transition: "box-shadow 0.3s ease"
  } : {};
  
  // During peek: temporarily remove blur by adding a class
  const peekClass = isPeeking ? "peeking" : "";
  
  // Determine if this is a silhouette peek (Here Now + hide_photo_in_venues)
  const isSilhouettePeek = context === "venue" && user?.hide_photo_in_venues === true;
  
  return (
    <div 
      className={`peekable-card-wrapper ${peekClass} ${isSilhouettePeek && isPeeking ? "silhouette-peek" : ""}`}
      style={borderStyle}
      onClick={handleCardClick}
    >
      <UserCard
        user={user}
        {...cardProps}
        context={context}
        // Pass peek state to UserCard for potential styling
        _isPeeking={isPeeking}
        _isSilhouettePeek={isSilhouettePeek}
      />
      
      {/* CSS for peek animation */}
      <style>{`
        .peekable-card-wrapper {
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }
        
        /* Regular peek: remove blur to show clear photo */
        .peekable-card-wrapper.peeking:not(.silhouette-peek) img {
          filter: none !important;
          transform: scale(1) !important;
          transition: filter 0.1s ease-out, transform 0.1s ease-out;
        }
        
        /* Silhouette peek: just do a subtle "flip" animation on the silhouette */
        .peekable-card-wrapper.silhouette-peek img {
          animation: silhouette-flip 0.2s ease-in-out;
        }
        
        @keyframes silhouette-flip {
          0% { transform: scale(1) rotateY(0deg); }
          50% { transform: scale(1.02) rotateY(10deg); }
          100% { transform: scale(1) rotateY(0deg); }
        }
        
        .peekable-card-wrapper:not(.peeking) img {
          transition: filter 0.15s ease-in, transform 0.15s ease-in;
        }
      `}</style>
    </div>
  );
};

export default PeekableCard;
