/**
 * Dynamic blur utility for profile photos
 * Applies stronger blur to close-up photos where faces are more recognizable
 */

// Blur strength levels (in pixels)
// Thumbnails: Allow vibe (silhouette, hair, posture) but hide facial features
// Full-size: Stronger blur for privacy until mutual match
export const BLUR_LEVELS = {
  THUMBNAIL_LIGHT: 1,    // Small thumbnails, distant/full-body shots - show shape clearly
  THUMBNAIL_MEDIUM: 2,   // Small thumbnails, standard shots - vibe visible, face hidden
  THUMBNAIL_STRONG: 3,   // Small thumbnails, close-up shots - silhouette only
  FULL_LIGHT: 6,         // Full-size, distant/full-body shots
  FULL_MEDIUM: 8,        // Full-size, standard shots  
  FULL_STRONG: 12,       // Full-size, close-up shots
};

/**
 * Analyze an image to determine if it's likely a close-up
 * Based on aspect ratio and image dimensions
 * @param {HTMLImageElement} img - The image element to analyze
 * @returns {string} - 'closeup', 'standard', or 'distant'
 */
export const analyzeImageType = (img) => {
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    return 'standard';
  }

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const aspectRatio = width / height;

  // Portrait orientation (taller than wide) - likely a close-up headshot
  if (aspectRatio < 0.9) {
    return 'closeup';
  }
  
  // Square-ish (common for profile pics, usually cropped headshots)
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
    // Check if image is high resolution (likely a quality headshot)
    if (width >= 400 && height >= 400) {
      return 'closeup';
    }
    return 'standard';
  }
  
  // Landscape (wider than tall) - likely shows more body/background
  if (aspectRatio > 1.3) {
    return 'distant';
  }
  
  return 'standard';
};

/**
 * Get the appropriate blur value based on image type and display size
 * @param {string} imageType - 'closeup', 'standard', or 'distant'
 * @param {boolean} isThumbnail - Whether this is a small thumbnail
 * @returns {number} - Blur radius in pixels
 */
export const getBlurStrength = (imageType, isThumbnail = false) => {
  if (isThumbnail) {
    switch (imageType) {
      case 'closeup':
        return BLUR_LEVELS.THUMBNAIL_STRONG;
      case 'distant':
        return BLUR_LEVELS.THUMBNAIL_LIGHT;
      default:
        return BLUR_LEVELS.THUMBNAIL_MEDIUM;
    }
  } else {
    switch (imageType) {
      case 'closeup':
        return BLUR_LEVELS.FULL_STRONG;
      case 'distant':
        return BLUR_LEVELS.FULL_LIGHT;
      default:
        return BLUR_LEVELS.FULL_MEDIUM;
    }
  }
};

/**
 * Generate inline style for dynamic blur
 * @param {number} blurStrength - Blur radius in pixels
 * @param {boolean} isRevealed - Whether the image should be unblurred
 * @returns {object} - React style object
 */
export const getBlurStyle = (blurStrength, isRevealed = false) => {
  if (isRevealed) {
    return {
      filter: 'blur(0)',
      WebkitFilter: 'blur(0)',
      transform: 'scale(1)',
      transition: 'all 0.3s ease',
    };
  }
  
  return {
    filter: `blur(${blurStrength}px)`,
    WebkitFilter: `blur(${blurStrength}px)`,
    transform: 'scale(1.05)',
    transition: 'all 0.3s ease',
  };
};
