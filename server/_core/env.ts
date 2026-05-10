export const ENV = {
  appId: process.env.VITE_APP_ID ?? "lff-landing-page",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Simple admin password for CRM login (replaces Manus OAuth) */
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  isProduction: process.env.NODE_ENV === "production",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  gmailUser: process.env.GMAIL_USER ?? "loverfighterfitness@gmail.com",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
};
