import { useCallback, useEffect, useRef, useState } from "react";
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

export type PushStatus =
  | "unsupported"   // no serviceWorker / PushManager (old browser, iOS Safari pre-PWA)
  | "unconfigured"  // VAPID key missing
  | "denied"        // user blocked notifications
  | "default"       // permission not yet requested
  | "granted";      // subscribed and active

export function usePushNotifications() {
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const hasRegistered = useRef(false);
  const [status, setStatus] = useState<PushStatus>("default");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const registerPush = useCallback(async (): Promise<PushStatus> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return "unsupported";
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus("unconfigured");
      return "unconfigured";
    }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission === "denied") {
        setStatus("denied");
        return "denied";
      }
      if (permission !== "granted") {
        setStatus("default");
        return "default";
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
        }));

      const json = subscription.toJSON();
      if (json.endpoint && json.keys) {
        subscribeMutation.mutate({
          endpoint: json.endpoint,
          keys: JSON.stringify(json.keys),
          userAgent: navigator.userAgent.slice(0, 512),
        });
        setEndpoint(json.endpoint);
      }
      setStatus("granted");
      return "granted";
    } catch (err) {
      console.warn("[Push] Registration failed:", err);
      setStatus("default");
      return "default";
    }
  }, [subscribeMutation]);

  useEffect(() => {
    // Detect iOS home-screen install
    const standalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      // iOS Safari quirk
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (hasRegistered.current) return;
    hasRegistered.current = true;
    registerPush();
  }, [registerPush]);

  return {
    status,
    endpoint,
    isStandalone,
    /** Re-run the subscription flow (e.g. after user clicks a button). */
    enable: registerPush,
  };
}
