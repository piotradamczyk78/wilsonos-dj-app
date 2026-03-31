/**
 * In-App Purchase Service
 * Handles Google Play consumable products for credits
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type Subscription,
} from 'react-native-iap';
import { Platform } from 'react-native';

// Product IDs configured in Google Play Console
export const PRODUCT_IDS = {
  STARTER: 'credits_starter_099', // $0.99 = 1000 credits
  POPULAR: 'credits_popular_499', // $4.99 = 5000 credits
  POWER: 'credits_power_999', // $9.99 = 10000 credits
};

export const PRODUCT_CREDITS = {
  [PRODUCT_IDS.STARTER]: 1000,
  [PRODUCT_IDS.POPULAR]: 5000,
  [PRODUCT_IDS.POWER]: 10000,
};

export interface CreditProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  credits: number;
  badge?: string;
}

let purchaseUpdateSubscription: Subscription | null = null;
let purchaseErrorSubscription: Subscription | null = null;

/**
 * Initialize IAP connection
 * Call this on app start or before showing buy screen
 */
export async function initIAP(): Promise<void> {
  try {
    await initConnection();
    console.log('[IAP] Connection initialized');
  } catch (error) {
    console.error('[IAP] Init error:', error);
    throw error;
  }
}

/**
 * End IAP connection
 * Call this on app unmount
 */
export async function disconnectIAP(): Promise<void> {
  try {
    await endConnection();
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    console.log('[IAP] Connection ended');
  } catch (error) {
    console.error('[IAP] Disconnect error:', error);
  }
}

/**
 * Fetch available products from Google Play
 */
export async function fetchProducts(): Promise<CreditProduct[]> {
  try {
    const products = await getProducts({ skus: Object.values(PRODUCT_IDS) });

    return products.map((product) => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.localizedPrice,
      credits: PRODUCT_CREDITS[product.productId as keyof typeof PRODUCT_CREDITS] || 0,
      badge: product.productId === PRODUCT_IDS.POPULAR ? 'Najlepsza wartość!' : undefined,
    }));
  } catch (error) {
    console.error('[IAP] Fetch products error:', error);
    throw error;
  }
}

/**
 * Purchase credits
 */
export async function purchaseCredits(
  productId: string,
  onSuccess: (credits: number) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    // Setup listeners
    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: ProductPurchase) => {
      console.log('[IAP] Purchase update:', purchase);

      if (purchase.productId === productId) {
        try {
          // Verify receipt with backend (optional but recommended)
          // const verified = await verifyReceipt(purchase.transactionReceipt);

          // For now, trust the purchase (WARNING: can be spoofed without backend verification)
          const credits = PRODUCT_CREDITS[productId as keyof typeof PRODUCT_CREDITS];

          if (credits) {
            onSuccess(credits);
          }

          // Finish transaction (mark as consumed)
          await finishTransaction({ purchase, isConsumable: true });
          console.log('[IAP] Transaction finished');
        } catch (error) {
          console.error('[IAP] Transaction finish error:', error);
          onError(error as Error);
        }
      }
    });

    purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.error('[IAP] Purchase error:', error);
      onError(new Error(error.message || 'Purchase failed'));
    });

    // Request purchase
    await requestPurchase({ sku: productId });
  } catch (error) {
    console.error('[IAP] Purchase request error:', error);
    onError(error as Error);
  }
}

/**
 * Restore purchases (mainly for iOS, but can be used for debugging)
 */
export async function restorePurchases(): Promise<void> {
  // For consumables, there's nothing to restore
  // This would be used for subscriptions/non-consumables
  console.log('[IAP] Restore purchases called (no-op for consumables)');
}

/**
 * Verify receipt with backend (recommended for production)
 * TODO: Implement backend verification
 */
async function verifyReceipt(receipt: string): Promise<boolean> {
  // In production, send receipt to your backend for verification
  // Backend should validate with Google Play Developer API
  console.log('[IAP] Receipt verification skipped (TODO: implement backend)');
  return true;
}
