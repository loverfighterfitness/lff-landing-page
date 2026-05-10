import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Media assets — tracks all files uploaded to S3 via the admin panel.
 * Used for testimonial photos, before/after images, logos, etc.
 */
export const mediaAssets = mysqlTable("media_assets", {
  id: int("id").autoincrement().primaryKey(),
  /** S3 key used to reference the file */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** Public CDN URL returned from storagePut */
  url: text("url").notNull(),
  /** Original filename from the upload */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** MIME type e.g. image/jpeg */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** File size in bytes */
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  /** Optional label/tag for organising assets */
  label: varchar("label", { length: 128 }),
  /** Who uploaded it */
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;

/**
 * Leads — enquiries submitted via the landing page contact form.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Preferred contact method: text or instagram */
  contactMethod: varchar("contact_method", { length: 20 }).default("text").notNull(),
  /** Phone number or Instagram handle */
  phone: varchar("phone", { length: 30 }).notNull(),
  /** Primary goal selected from dropdown */
  goal: mysqlEnum("goal", [
    "lose_weight",
    "build_muscle",
    "comp_prep",
    "strength",
    "general_fitness",
    "other",
  ]).notNull(),
  /** Optional free-text message */
  message: text("message"),
  /** Where the lead came from */
  source: varchar("source", { length: 64 }).default("landing_page").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Calculator Leads — submissions from the calorie calculator with SMS tracking.
 */
export const calculatorLeads = mysqlTable("calculator_leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** Phone number for SMS */
  phone: varchar("phone", { length: 30 }).notNull(),
  /** Age from calculator */
  age: int("age").notNull(),
  /** Weight in kg */
  weight: int("weight").notNull(),
  /** Height in cm */
  height: int("height").notNull(),
  /** Goal selected by user */
  goal: varchar("goal", { length: 30 }).default("maintain").notNull(),
  /** Calculated TDEE */
  tdee: int("tdee").notNull(),
  /** Calculated BMR */
  bmr: int("bmr").notNull(),
  /** Calculated protein in grams */
  protein: int("protein").notNull(),
  /** Calculated carbs in grams */
  carbs: int("carbs").notNull(),
  /** Calculated fats in grams */
  fats: int("fats").notNull(),
  /** SMS status: pending, sent_1, sent_2, sent_3 */
  smsStatus: varchar("smsStatus", { length: 20 }).default("pending").notNull(),
  /** Timestamp of first SMS sent */
  sms1SentAt: timestamp("sms1SentAt"),
  /** Timestamp of second SMS sent */
  sms2SentAt: timestamp("sms2SentAt"),
  /** Timestamp of third SMS sent */
  sms3SentAt: timestamp("sms3SentAt"),
  /** TextMagic message ID for first SMS */
  sms1MessageId: varchar("sms1MessageId", { length: 100 }),
  /** TextMagic message ID for second SMS */
  sms2MessageId: varchar("sms2MessageId", { length: 100 }),
  /** TextMagic message ID for third SMS */
  sms3MessageId: varchar("sms3MessageId", { length: 100 }),
  /** Admin notes for this lead */
  notes: text("notes"),
  /** Follow-up reminder date */
  followUpDate: timestamp("followUpDate"),
  /** Follow-up reminder note */
  followUpNote: text("followUpNote"),
  /** Referral code used when this lead signed up */
  referredBy: varchar("referredBy", { length: 32 }),
  /** Pipeline status: new, contacted, converted, not_interested */
  leadStatus: mysqlEnum("leadStatus", ["new", "contacted", "converted", "not_interested"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalculatorLead = typeof calculatorLeads.$inferSelect;
export type InsertCalculatorLead = typeof calculatorLeads.$inferInsert;

/**
 * Push Subscriptions — stores browser push subscriptions for owner notifications.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** The push endpoint URL */
  endpoint: text("endpoint").notNull(),
  /** JSON-encoded keys object {p256dh, auth} */
  keys: text("keys").notNull(),
  /** User agent hint for debugging */
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Referral Codes — unique codes given to existing clients to share.
 * Tracks who referred new leads.
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** The unique referral code (e.g. RUBY2024) */
  code: varchar("code", { length: 32 }).notNull().unique(),
  /** Display name for the referrer (e.g. "Ruby") */
  referrerName: varchar("referrerName", { length: 255 }).notNull(),
  /** Optional notes about this referrer */
  notes: text("notes"),
  /** Whether this code is active */
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

/**
 * SMS Jobs — persistent queue for scheduled SMS messages.
 * Survives server restarts unlike setTimeout-based scheduling.
 */
export const smsJobs = mysqlTable("sms_jobs", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the calculator lead */
  leadId: int("leadId").notNull().references(() => calculatorLeads.id),
  /** Phone number to send to */
  phone: varchar("phone", { length: 30 }).notNull(),
  /** Full SMS message body */
  message: text("message").notNull(),
  /** Which SMS in the sequence (1, 2, or 3) */
  smsNumber: int("smsNumber").notNull(),
  /** When the SMS should be sent (UTC) */
  sendAt: timestamp("sendAt").notNull(),
  /** When it was actually sent */
  sentAt: timestamp("sentAt"),
  /** Job status: pending, sent, failed */
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** TextMagic message ID on success */
  messageId: varchar("messageId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsJob = typeof smsJobs.$inferSelect;
export type InsertSmsJob = typeof smsJobs.$inferInsert;

// ─── Shop ────────────────────────────────────────────────────────────────────

/**
 * Shop Products — each sellable item in the LFF merch store.
 */
export const shopProducts = mysqlTable("shop_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  /** Price in cents (AUD) */
  price: int("price").notNull(),
  /** Stripe Price ID */
  priceId: varchar("priceId", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["socks", "straps", "cuffs", "tee", "bundle"]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = typeof shopProducts.$inferInsert;

/**
 * Shop Variants — colour/size combinations with stock tracking.
 */
export const shopVariants = mysqlTable("shop_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => shopProducts.id),
  colour: varchar("colour", { length: 64 }),
  size: varchar("size", { length: 16 }),
  stock: int("stock").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopVariant = typeof shopVariants.$inferSelect;
export type InsertShopVariant = typeof shopVariants.$inferInsert;

/**
 * Shop Orders — tracks completed Stripe checkout sessions for merch purchases.
 */
export const shopOrders = mysqlTable("shop_orders", {
  id: int("id").autoincrement().primaryKey(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntent: varchar("stripePaymentIntent", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  /** JSON-encoded shipping address */
  shippingAddress: text("shippingAddress"),
  isShipping: boolean("isShipping").default(false).notNull(),
  /** Shipping cost in cents */
  shippingCost: int("shippingCost").default(0).notNull(),
  /** Subtotal in cents (before shipping) */
  subtotal: int("subtotal").default(0).notNull(),
  /** Total in cents (including shipping) */
  total: int("total").default(0).notNull(),
  status: mysqlEnum("status", ["unfulfilled", "shipped", "delivered"]).default("unfulfilled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopOrder = typeof shopOrders.$inferSelect;
export type InsertShopOrder = typeof shopOrders.$inferInsert;

/**
 * Shop Order Items — individual line items within an order.
 */
export const shopOrderItems = mysqlTable("shop_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => shopOrders.id),
  productName: varchar("productName", { length: 255 }).notNull(),
  /** Variant descriptor e.g. "Brown / L" */
  variant: varchar("variant", { length: 128 }),
  quantity: int("quantity").notNull(),
  /** Unit price in cents */
  unitPrice: int("unitPrice").notNull(),
  /** Stripe Price ID for this line item */
  priceId: varchar("priceId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopOrderItem = typeof shopOrderItems.$inferSelect;
export type InsertShopOrderItem = typeof shopOrderItems.$inferInsert;
