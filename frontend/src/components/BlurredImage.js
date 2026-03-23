import { useState, useRef, useEffect } from 'react';
import { analyzeImageType, getBlurStrength, getBlurStyle } from '../utils/imageBlur';

/**
 * BlurredImage component that applies dynamic blur based on image characteristics
 * Close-up photos receive stronger blur to maintain consistent recognizability
 */
const BlurredImage = ({ 
  src, 
  alt, 
  className = '', 
  isRevealed = false, 
  isThumbnail = false,
  fallbackInitial = '?',
  onLoad,
  ...props 
}) => {
  const [imageType, setImageType] = useState('standard');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Reset state when src changes
    setLoaded(false);
    setError(false);
    setImageType('standard');
  }, [src]);

  const handleLoad = (e) => {
    const img = e.target;
    const type = analyzeImageType(img);
    setImageType(type);
    setLoaded(true);
    
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = () => {
    setError(true);
  };

  // If no src or error, show fallback
  if (!src || error) {
    return (
      <div 
        className={`w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ${className}`}
        {...props}
      >
        <span className="text-4xl text-slate-400">
          {fallbackInitial}
        </span>
      </div>
    );
  }

  const blurStrength = getBlurStrength(imageType, isThumbnail);
  const blurStyle = getBlurStyle(blurStrength, isRevealed);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      style={blurStyle}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default BlurredImage;
