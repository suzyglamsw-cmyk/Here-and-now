import axios from 'axios';

/**
 * Google Play Billing utility for Android WebView/TWA integration
 * This handles communication between the web app and Google Play Billing
 */

// Check if running in Android WebView with Google Play Billing bridge
export function isGooglePlayAvailable() {
  return typeof window !== 'undefined' && 
         typeof window.AndroidBridge !== 'undefined' &&
         typeof window.AndroidBridge.launchBillingFlow === 'function';
}

// Check if running in Android environment (WebView or TWA)
export function isAndroidEnvironment() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('android') && (ua.includes('wv') || window.AndroidBridge);
}

/**
 * Get Google Play Billing status from backend
 */
export async function getGooglePlayStatus(api) {
  try {
    const response = await axios.get(`${api}/google-play/status`);
    return response.data;
  } catch (error) {
    console.error('Failed to get Google Play status:', error);
    return { configured: false };
  }
}

/**
 * Launch Google Play billing flow via Android bridge
 * @param {string} productId - The Google Play product ID
 * @param {string} productType - "subscription" or "inapp"
 */
export function launchBillingFlow(productId, productType = 'inapp') {
  return new Promise((resolve, reject) => {
    if (!isGooglePlayAvailable()) {
      reject(new Error('Google Play Billing not available'));
      return;
    }

    // Set up callback for purchase result
    window.onGooglePlayPurchaseResult = (result) => {
      try {
        const data = JSON.parse(result);
        if (data.success) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Purchase failed'));
        }
      } catch (e) {
        reject(new Error('Invalid purchase result'));
      }
    };

    // Launch the billing flow
    try {
      window.AndroidBridge.launchBillingFlow(productId, productType);
    } catch (e) {
      reject(new Error('Failed to launch billing flow'));
    }
  });
}

/**
 * Verify a Google Play purchase with backend
 */
export async function verifyPurchase(api, purchaseData) {
  try {
    const response = await axios.post(`${api}/google-play/verify-purchase`, {
      package_name: purchaseData.packageName,
      product_id: purchaseData.productId,
      purchase_token: purchaseData.purchaseToken,
      purchase_type: purchaseData.purchaseType || 'inapp'
    });
    return response.data;
  } catch (error) {
    console.error('Failed to verify purchase:', error);
    throw error;
  }
}

/**
 * Acknowledge a subscription purchase
 */
export async function acknowledgeSubscription(api, purchaseData) {
  try {
    const response = await axios.post(`${api}/google-play/acknowledge`, {
      package_name: purchaseData.packageName,
      subscription_id: purchaseData.productId,
      purchase_token: purchaseData.purchaseToken
    });
    return response.data;
  } catch (error) {
    console.error('Failed to acknowledge subscription:', error);
    throw error;
  }
}

/**
 * Consume a one-time purchase (allows repurchase)
 */
export async function consumePurchase(api, purchaseData) {
  try {
    const response = await axios.post(`${api}/google-play/consume`, {
      package_name: purchaseData.packageName,
      product_id: purchaseData.productId,
      purchase_token: purchaseData.purchaseToken,
      purchase_type: 'product'
    });
    return response.data;
  } catch (error) {
    console.error('Failed to consume purchase:', error);
    throw error;
  }
}

/**
 * Get user's Google Play subscription status
 */
export async function getSubscriptionStatus(api) {
  try {
    const response = await axios.get(`${api}/google-play/subscription-status`);
    return response.data;
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return { has_subscription: false };
  }
}

/**
 * Get user's Google Play purchase history
 */
export async function getPurchaseHistory(api) {
  try {
    const response = await axios.get(`${api}/google-play/purchases`);
    return response.data;
  } catch (error) {
    console.error('Failed to get purchase history:', error);
    return [];
  }
}

/**
 * Complete purchase flow: launch billing -> verify -> acknowledge/consume
 */
export async function completePurchase(api, productId, productType = 'inapp') {
  // Step 1: Launch billing flow
  const purchaseResult = await launchBillingFlow(productId, productType);
  
  // Step 2: Verify with backend
  const verification = await verifyPurchase(api, {
    packageName: purchaseResult.packageName,
    productId: purchaseResult.productId,
    purchaseToken: purchaseResult.purchaseToken,
    purchaseType: productType
  });
  
  if (!verification.valid) {
    throw new Error(verification.message || 'Purchase verification failed');
  }
  
  // Step 3: Acknowledge (subscription) or Consume (one-time)
  if (productType === 'subscription') {
    await acknowledgeSubscription(api, {
      packageName: purchaseResult.packageName,
      productId: purchaseResult.productId,
      purchaseToken: purchaseResult.purchaseToken
    });
  } else {
    await consumePurchase(api, {
      packageName: purchaseResult.packageName,
      productId: purchaseResult.productId,
      purchaseToken: purchaseResult.purchaseToken
    });
  }
  
  return verification;
}

// Product ID mappings for the app
export const GOOGLE_PLAY_PRODUCTS = {
  premium_monthly: {
    id: 'premium_monthly',
    type: 'subscription',
    name: 'Premium Monthly',
    price: '£7.99'
  },
  premium_yearly: {
    id: 'premium_yearly', 
    type: 'subscription',
    name: 'Premium Yearly',
    price: '£59.99'
  },
  tokens_5: {
    id: 'tokens_5',
    type: 'inapp',
    name: '5 Tokens',
    price: '£3.99'
  },
  tokens_15: {
    id: 'tokens_15',
    type: 'inapp',
    name: '15 Tokens',
    price: '£7.99'
  },
  tokens_50: {
    id: 'tokens_50',
    type: 'inapp',
    name: '50 Tokens',
    price: '£19.99'
  }
};

export default {
  isGooglePlayAvailable,
  isAndroidEnvironment,
  getGooglePlayStatus,
  launchBillingFlow,
  verifyPurchase,
  acknowledgeSubscription,
  consumePurchase,
  getSubscriptionStatus,
  getPurchaseHistory,
  completePurchase,
  GOOGLE_PLAY_PRODUCTS
};
