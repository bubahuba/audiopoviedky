import {isSubscriptionActive} from './index';
import {loadStoredSubscription} from './subscriptionStorage';

export async function isStoredSubscriptionActive(): Promise<boolean> {
  const stored = await loadStoredSubscription();
  if (!stored?.expiryDuration) {
    return false;
  }
  return isSubscriptionActive(stored.expiryDuration);
}
