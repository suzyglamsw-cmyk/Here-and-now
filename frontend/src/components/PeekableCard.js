/**
 * PeekableCard Component - Elegant Iris Peek v5
 * 
 * Smooth, refined iris reveal with gentle expansion
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserCard } from "./UserCard";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const EXPAND_DURATION = 500;
const FADE_DURATION = 300;
const TOTAL_DURATION = EXPAND_DURATION + FADE_DURATION;

export const PeekableCard = ({
  user,
  peekStatus,
  onPeekComplete,
  context = "venue",
  isMatched = false,
  ...cardProps
}) => {
  const navigate = useNavigate();
  const [isPeeking, setIsPeeking] = useState(false);
  const [hasPeekedLocal, setHasPeekedLocal] = useState(peekStatus?.has_peeked || false);
  const cardRef = useRef(null);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    setHasPeekedLocal(peekStatus?.has_peeked || false);
  }, [peekStatus?.has_peeked]);
  
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && isPeeking) {
        setIsPeeking(false);
        clearTimeout(timeoutRef.current);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [isPeeking]);
  
  const allowPeek = peekStatus?.allow_peek !== false;
  const hideInVenues = user?.hide_photo_in_venues === true;
  const isMutual = isMatched || user?.is_connection_accepted;
  const peekDisabled = isMutual || (context === "venue" && hideInVenues);
  const canPeek = allowPeek && !hasPeekedLocal && !peekDisabled && peekStatus?.can_peek !== false;
  const showBorder = canPeek;
  
  const getBorderColor = () => {
    if (!showBorder) return "transparent";
    const g = user?.show_as || peekStatus?.show_as;
    return g === "female" ? "#FF2D8D" : g === "male" ? "#3A7BFF" : "#8B5CF6";
  };
  
  const getPhotoUrl = () => {
    const p = user?.photos?.[0] || user?.avatar_url || user?.photo_url || "";
    if (!p) return "";
    return p.startsWith('/api/') || p.startsWith('http') ? p : `/api/photos/serve/${p}`;
  };
  
  const addBlurParam = (url, blur) => {
    if (!url) return "";
    const val = blur ? 'true' : 'false';
    if (url.includes('blur=')) return url.replace(/blur=(true|false)/g, `blur=${val}`);
    return url + (url.includes('?') ? '&' : '?') + `blur=${val}`;
  };
  
  const clearUrl = addBlurParam(getPhotoUrl(), false);
  const blurUrl = addBlurParam(getPhotoUrl(), true);
  
  useEffect(() => {
    if (canPeek && clearUrl) {
      const img = new Image();
      img.src = clearUrl;
    }
  }, [canPeek, clearUrl]);
  
  const handleClick = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isPeeking) return;
    
    if (!canPeek) {
      navigate(`/profile/${user.id}`);
      return;
    }
    
    try {
      await axios.post(`${API}/api/peek/${user.id}`);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 403) {
        setHasPeekedLocal(true);
        navigate(`/profile/${user.id}`);
        return;
      }
    }
    
    setIsPeeking(true);
    
    timeoutRef.current = setTimeout(() => {
      setIsPeeking(false);
      setHasPeekedLocal(true);
      onPeekComplete?.(user.id);
    }, TOTAL_DURATION);
    
  }, [isPeeking, canPeek, user?.id, navigate, onPeekComplete]);
  
  const uid = user?.id?.replace(/-/g, '') || 'default';
  
  return (
    <div 
      ref={cardRef}
      className="peekable-card-wrapper"
      onClick={handleClick}
      style={{
        position: "relative",
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: showBorder ? `0 0 0 3px ${getBorderColor()}` : "none",
        transition: "box-shadow 0.3s ease",
        cursor: "pointer"
      }}
    >
      <UserCard
        user={user}
        {...cardProps}
        context={context}
        isMatched={isMatched}
        disableClick={true}
      />
      
      {isPeeking && (
        <>
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            borderRadius: "1rem",
            overflow: "hidden",
            pointerEvents: "none"
          }}>
            {/* Blurred base layer */}
            <img
              src={blurUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(12px)",
                transform: "scale(1.05)"
              }}
            />
            
            {/* Clear reveal layer with elegant iris */}
            <div
              className={`iris-reveal-${uid}`}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 1
              }}
            >
              <img
                src={clearUrl}
                alt=""
                className={`iris-img-${uid}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "none",
                  WebkitFilter: "none"
                }}
              />
            </div>
          </div>
          
          <style>{`
            .iris-reveal-${uid} {
              animation: irisFade-${uid} ${TOTAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .iris-img-${uid} {
              -webkit-mask-image: radial-gradient(
                circle 0px at 50% 33%,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,0.8) 40%,
                rgba(0,0,0,0) 100%
              );
              mask-image: radial-gradient(
                circle 0px at 50% 33%,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,0.8) 40%,
                rgba(0,0,0,0) 100%
              );
              animation: irisExpand-${uid} ${TOTAL_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            
            @keyframes irisExpand-${uid} {
              0% {
                -webkit-mask-image: radial-gradient(
                  circle 0px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
                mask-image: radial-gradient(
                  circle 0px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
              }
              15% {
                -webkit-mask-image: radial-gradient(
                  circle 8px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
                mask-image: radial-gradient(
                  circle 8px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
              }
              40% {
                -webkit-mask-image: radial-gradient(
                  circle 35px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
                mask-image: radial-gradient(
                  circle 35px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.6) 50%,
                  rgba(0,0,0,0) 100%
                );
              }
              62% {
                -webkit-mask-image: radial-gradient(
                  circle 55px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.5) 50%,
                  rgba(0,0,0,0) 100%
                );
                mask-image: radial-gradient(
                  circle 55px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.5) 50%,
                  rgba(0,0,0,0) 100%
                );
              }
              100% {
                -webkit-mask-image: radial-gradient(
                  circle 55px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.5) 50%,
                  rgba(0,0,0,0) 100%
                );
                mask-image: radial-gradient(
                  circle 55px at 50% 33%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.5) 50%,
                  rgba(0,0,0,0) 100%
                );
              }
            }
            
            @keyframes irisFade-${uid} {
              0%, 60% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default PeekableCard;
