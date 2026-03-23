/**
 * Extract a user-friendly error message from API error responses
 * Handles FastAPI validation errors which come as arrays of objects
 * @param {Error} error - Axios error object
 * @param {string} fallback - Fallback message if extraction fails
 * @returns {string} - Human-readable error message
 */
export const getErrorMessage = (error, fallback = "An error occurred") => {
  const detail = error.response?.data?.detail;
  
  if (typeof detail === "string") {
    return detail;
  }
  
  if (Array.isArray(detail) && detail.length > 0) {
    // FastAPI validation error format: [{loc: [...], msg: "...", type: "..."}]
    return detail[0]?.msg || detail[0]?.message || fallback;
  }
  
  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || fallback;
  }
  
  return fallback;
};
