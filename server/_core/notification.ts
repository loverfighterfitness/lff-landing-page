/**
 * Owner notification — logs to console (Manus Forge service removed).
 * Email notifications handle the real alerting via email.ts.
 */
export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Dispatches an owner notification. With Manus removed, this just logs
 * to console. Email/push notifications are the real channels now.
 * Always returns true so callers don't need to handle failures.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] ${payload.title}\n${payload.content}`);
  return true;
}
