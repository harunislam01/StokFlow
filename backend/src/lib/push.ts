import webpush from 'web-push';
import prisma from './prisma';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:mehmet@example.com',
    publicKey,
    privateKey
  );
  console.log('[PushService]: VAPID details configured successfully.');
} else {
  console.warn('[PushService]: VAPID keys not configured in environment.');
}

export const sendPushNotification = async (title: string, body: string, url: string = '/') => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) return;

    console.log(`[PushService]: Sending push notification to ${subscriptions.length} devices.`);

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/logo.jpeg',
        badge: '/icon.svg',
        data: { url }
      }
    });

    const promises = subscriptions.map(async (sub: any) => {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh || '',
            auth: sub.keys?.auth || ''
          }
        };
        await webpush.sendNotification(pushSub, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid: delete from DB safely
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          console.log(`[PushService]: Cleaned up stale subscription: ${sub.id}`);
        } else {
          console.error(`[PushService]: Error dispatching to subscription ID ${sub.id}:`, err);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[PushService]: General push delivery error:', error);
  }
};
