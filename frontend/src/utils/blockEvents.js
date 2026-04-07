/**
 * Block Event System
 * 
 * Provides a simple event-based system for notifying components when a user is blocked.
 * Components can listen for block events and refresh their data accordingly.
 */

const BLOCK_EVENT = 'user-blocked';

/**
 * Dispatch a block event to notify all listening components
 * @param {string} blockedUserId - The ID of the blocked user
 */
export const dispatchBlockEvent = (blockedUserId) => {
  const event = new CustomEvent(BLOCK_EVENT, {
    detail: { blockedUserId }
  });
  window.dispatchEvent(event);
};

/**
 * Subscribe to block events
 * @param {function} callback - Function to call when a user is blocked
 * @returns {function} Cleanup function to remove the listener
 */
export const onUserBlocked = (callback) => {
  const handler = (event) => {
    callback(event.detail.blockedUserId);
  };
  window.addEventListener(BLOCK_EVENT, handler);
  return () => window.removeEventListener(BLOCK_EVENT, handler);
};

export default { dispatchBlockEvent, onUserBlocked };
