import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (hasRegistered.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    hasRegistered.current = true;

    async function registerPush() {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Check existing permission
        const permission = Notification.permission;
        if (permission === "denied") return;

        // Request permission if not yet granted
        let finalPermission: NotificationPermission = permission;
        if (permission === "default") {
          finalPermission = await Notification.requestPermission();
        }
        if (finalPermission !== "granted") return;

        // Subscribe to push
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
          }));

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys) return;

        subscribeMutation.mutate({
          endpoint: json.endpoint,
          keys: JSON.stringify(json.keys),
          userAgent: navigator.userAgent.slice(0, 512),
        });
      } catch (err) {
        console.warn("[Push] Registration failed:", err);
      }
    }

    registerPush();
  }, []);
}
