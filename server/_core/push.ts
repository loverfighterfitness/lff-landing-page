import webpush from "web-push";
import { ENV } from "./env";

let initialized = false;

function initWebPush() {
  if (initialized) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:loverfighterfitness@gmail.com",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: string },
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  initWebPush();
  if (!initialized) return { success: false, error: "VAPID not configured" };

  try {
    let keys: { p256dh: string; auth: string };
    try {
      keys = JSON.parse(subscription.keys);
    } catch {
      return { success: false, error: "Invalid subscription keys JSON" };
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys,
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (err: any) {
    // 410 Gone = subscription expired/unsubscribed
    if (err?.statusCode === 410) {
      return { success: false, error: "subscription_expired" };
    }
    console.error("[Push] sendNotification error:", err?.message ?? err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
