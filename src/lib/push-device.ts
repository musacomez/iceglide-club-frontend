import { api } from '@/lib/api/endpoints';

export function pushBrowserSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function unsubscribeLocalPush() {
  if (!pushBrowserSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
}

export async function deleteLocalPushSubscription() {
  if (!pushBrowserSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api.deletePushDevice(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
}
