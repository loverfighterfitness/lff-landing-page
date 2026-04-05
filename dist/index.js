// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var mediaAssets = mysqlTable("media_assets", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Phone number */
  phone: varchar("phone", { length: 30 }).notNull(),
  /** Primary goal selected from dropdown */
  goal: mysqlEnum("goal", [
    "lose_weight",
    "build_muscle",
    "comp_prep",
    "strength",
    "general_fitness",
    "other"
  ]).notNull(),
  /** Optional free-text message */
  message: text("message"),
  /** Where the lead came from */
  source: varchar("source", { length: 64 }).default("landing_page").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var calculatorLeads = mysqlTable("calculator_leads", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** The push endpoint URL */
  endpoint: text("endpoint").notNull(),
  /** JSON-encoded keys object {p256dh, auth} */
  keys: text("keys").notNull(),
  /** User agent hint for debugging */
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** The unique referral code (e.g. RUBY2024) */
  code: varchar("code", { length: 32 }).notNull().unique(),
  /** Display name for the referrer (e.g. "Ruby") */
  referrerName: varchar("referrerName", { length: 255 }).notNull(),
  /** Optional notes about this referrer */
  notes: text("notes"),
  /** Whether this code is active */
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var smsJobs = mysqlTable("sms_jobs", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  gmailUser: process.env.GMAIL_USER ?? "loverfighterfitness@gmail.com",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function insertLead(lead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(lead);
  return result;
}
async function getLeads(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}
async function getCalculatorLeads(limit = 200) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(calculatorLeads).orderBy(desc(calculatorLeads.createdAt)).limit(limit);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/storage.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq2 } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z as z2 } from "zod";

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/routers/storage.ts
var storageRouter = router({
  /**
   * Upload a file — accepts base64-encoded file data from the client.
   * Admin only.
   */
  upload: adminProcedure.input(
    z2.object({
      filename: z2.string().min(1),
      mimeType: z2.string().min(1),
      /** Base64-encoded file content */
      data: z2.string().min(1),
      fileSize: z2.number().int().positive(),
      label: z2.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const buffer = Buffer.from(input.data, "base64");
    const ext = input.filename.split(".").pop() ?? "bin";
    const fileKey = `lff-media/${nanoid(10)}-${Date.now()}.${ext}`;
    const { url } = await storagePut(fileKey, buffer, input.mimeType);
    await db.insert(mediaAssets).values({
      fileKey,
      url,
      filename: input.filename,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      label: input.label ?? null,
      uploadedBy: ctx.user.id
    });
    return { fileKey, url, filename: input.filename };
  }),
  /**
   * List all uploaded media assets. Admin only.
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const assets = await db.select().from(mediaAssets).orderBy(mediaAssets.createdAt);
    return assets;
  }),
  /**
   * Delete a media asset record (does not delete from S3 — files are public CDN).
   * Admin only.
   */
  delete: adminProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    await db.delete(mediaAssets).where(eq2(mediaAssets.id, input.id));
    return { success: true };
  })
});

// server/routers/leads.ts
import { z as z3 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";
var GOAL_LABELS = {
  lose_weight: "Lose Weight / Tone Up",
  build_muscle: "Build Muscle / Bulk",
  comp_prep: "Competition Prep",
  strength: "Strength / Powerlifting",
  general_fitness: "General Fitness",
  other: "Other"
};
var leadsRouter = router({
  /**
   * Public mutation — anyone can submit a lead from the landing page.
   */
  submit: publicProcedure.input(
    z3.object({
      name: z3.string().min(2, "Name must be at least 2 characters").max(255),
      phone: z3.string().min(6, "Enter a valid phone number").max(30),
      goal: z3.enum([
        "lose_weight",
        "build_muscle",
        "comp_prep",
        "strength",
        "general_fitness",
        "other"
      ]),
      message: z3.string().max(1e3).optional()
    })
  ).mutation(async ({ input }) => {
    try {
      await insertLead({
        name: input.name,
        phone: input.phone,
        goal: input.goal,
        message: input.message ?? null,
        source: "landing_page"
      });
      const goalLabel = GOAL_LABELS[input.goal] ?? input.goal;
      await notifyOwner({
        title: `New Lead: ${input.name}`,
        content: [
          `**Name:** ${input.name}`,
          `**Phone:** ${input.phone}`,
          `**Goal:** ${goalLabel}`,
          input.message ? `**Message:** ${input.message}` : null
        ].filter(Boolean).join("\n")
      });
      return { success: true };
    } catch (error) {
      console.error("[Leads] Failed to submit lead:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again."
      });
    }
  }),
  /**
   * Protected — admin only: list all leads.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    return getLeads(200);
  })
});

// server/routers/calculator.ts
import { z as z4 } from "zod";

// server/_core/sms.ts
import axios2 from "axios";
var TEXTMAGIC_API_URL = "https://rest.textmagic.com/api/v2";
async function sendSMS(options) {
  try {
    const apiUser = process.env.TEXTMAGIC_API_USER;
    const apiKey = process.env.TEXTMAGIC_API_KEY;
    if (!apiUser || !apiKey) {
      throw new Error("TextMagic credentials not configured");
    }
    const response = await axios2.post(
      `${TEXTMAGIC_API_URL}/messages`,
      {
        phones: options.phone,
        text: options.message
      },
      {
        auth: {
          username: apiUser,
          password: apiKey
        },
        timeout: 1e4
      }
    );
    console.log("[SMS] TextMagic response status:", response.status);
    console.log("[SMS] TextMagic response data:", JSON.stringify(response.data));
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        messageId: response.data.id || response.data.messageId || response.data.sessionId
      };
    }
    return {
      success: false,
      error: response.data?.error || `HTTP ${response.status}`
    };
  } catch (error) {
    console.error("SMS sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS"
    };
  }
}

// server/smsScheduler.ts
import { and, eq as eq3, lte } from "drizzle-orm";
var schedulerInterval = null;
async function enqueueSmsJob({
  leadId,
  phone,
  message,
  smsNumber,
  delayMs
}) {
  const db = await getDb();
  if (!db) {
    console.error("[SmsScheduler] DB not available \u2014 cannot enqueue SMS job");
    return;
  }
  const sendAt = new Date(Date.now() + delayMs);
  await db.insert(smsJobs).values({
    leadId,
    phone,
    message,
    smsNumber,
    sendAt,
    status: "pending"
  });
  console.log(`[SmsScheduler] Enqueued SMS #${smsNumber} for lead ${leadId}, sendAt: ${sendAt.toISOString()}`);
}
async function processDueJobs() {
  const db = await getDb();
  if (!db) return;
  try {
    const now = /* @__PURE__ */ new Date();
    const dueJobs = await db.select().from(smsJobs).where(and(eq3(smsJobs.status, "pending"), lte(smsJobs.sendAt, now)));
    if (dueJobs.length === 0) return;
    console.log(`[SmsScheduler] Processing ${dueJobs.length} due SMS job(s)`);
    for (const job of dueJobs) {
      try {
        const result = await sendSMS({ phone: job.phone, message: job.message });
        if (result.success) {
          await db.update(smsJobs).set({ status: "sent", sentAt: /* @__PURE__ */ new Date(), messageId: result.messageId ?? null }).where(eq3(smsJobs.id, job.id));
          const smsNum = job.smsNumber;
          const leadUpdate = {};
          if (smsNum === 1) {
            leadUpdate.sms1SentAt = /* @__PURE__ */ new Date();
            leadUpdate.sms1MessageId = result.messageId ?? null;
          } else if (smsNum === 2) {
            leadUpdate.sms2SentAt = /* @__PURE__ */ new Date();
            leadUpdate.sms2MessageId = result.messageId ?? null;
          } else if (smsNum === 3) {
            leadUpdate.sms3SentAt = /* @__PURE__ */ new Date();
            leadUpdate.sms3MessageId = result.messageId ?? null;
          }
          await db.update(calculatorLeads).set(leadUpdate).where(eq3(calculatorLeads.id, job.leadId));
          console.log(`[SmsScheduler] Sent SMS #${job.smsNumber} for lead ${job.leadId} (job ${job.id})`);
        } else {
          await db.update(smsJobs).set({ status: "failed", errorMessage: result.error ?? "Unknown error" }).where(eq3(smsJobs.id, job.id));
          console.error(`[SmsScheduler] Failed SMS #${job.smsNumber} for lead ${job.leadId}:`, result.error);
        }
      } catch (err) {
        await db.update(smsJobs).set({ status: "failed", errorMessage: String(err) }).where(eq3(smsJobs.id, job.id));
        console.error(`[SmsScheduler] Error processing job ${job.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[SmsScheduler] Error fetching due jobs:", err);
  }
}
function startSmsScheduler() {
  if (schedulerInterval) {
    console.warn("[SmsScheduler] Already running \u2014 skipping start");
    return;
  }
  console.log("[SmsScheduler] Starting \u2014 polling every 60 seconds");
  processDueJobs().catch((e) => console.error("[SmsScheduler] Initial run error:", e));
  schedulerInterval = setInterval(() => {
    processDueJobs().catch((e) => console.error("[SmsScheduler] Poll error:", e));
  }, 60 * 1e3);
}

// server/routers/calculator.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { eq as eq4 } from "drizzle-orm";

// server/_core/email.ts
import nodemailer from "nodemailer";
async function sendEmail({
  to,
  subject,
  html
}) {
  if (!ENV.gmailAppPassword) {
    console.warn("[Email] GMAIL_APP_PASSWORD not set \u2014 skipping email");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ENV.gmailUser,
        pass: ENV.gmailAppPassword
      }
    });
    await transporter.sendMail({
      from: `"LFF Website" <${ENV.gmailUser}>`,
      to,
      subject,
      html
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

// server/_core/push.ts
import webpush from "web-push";
var initialized = false;
function initWebPush() {
  if (initialized) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured \u2014 push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:loverfighterfitness@gmail.com",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  initialized = true;
}
async function sendPushNotification(subscription, payload) {
  initWebPush();
  if (!initialized) return { success: false, error: "VAPID not configured" };
  try {
    let keys;
    try {
      keys = JSON.parse(subscription.keys);
    } catch {
      return { success: false, error: "Invalid subscription keys JSON" };
    }
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (err) {
    if (err?.statusCode === 410) {
      return { success: false, error: "subscription_expired" };
    }
    console.error("[Push] sendNotification error:", err?.message ?? err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

// server/routers/calculator.ts
function formatSMS1(name, tdee, protein, carbs, fats, link) {
  return `Hi ${name}! \u{1F44B} Your personalized macros are ready:

Daily calories: ${tdee}
Protein: ${protein}g | Carbs: ${carbs}g | Fats: ${fats}g

Get your full breakdown & tips: ${link}

- Levi @ LFF`;
}
function formatSMS2(name) {
  return `${name}, Ruby went from 0 to comp-ready in 12 weeks \u{1F4AA} She used personalized macros + my coaching. Want to know her secret? Reply CALL or visit www.loverfighterfitness.com`;
}
function formatSMS3(name, link) {
  return `Ready to transform your body? I have limited spots for personalized coaching this month. Let's chat about your goals. Book your free consultation: ${link}`;
}
var calculatorRouter = router({
  /**
   * Protected query — get all calculator leads for admin dashboard
   */
  getLeads: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Admin only" });
    }
    try {
      return await getCalculatorLeads(500);
    } catch (error) {
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" });
    }
  }),
  /**
   * Protected mutation — update notes for a lead
   */
  updateNotes: protectedProcedure.input(z4.object({ id: z4.number().int(), notes: z4.string().max(2e3) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError5({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(calculatorLeads).set({ notes: input.notes }).where(eq4(calculatorLeads.id, input.id));
    return { success: true };
  }),
  /**
   * Protected mutation — update follow-up reminder for a lead
   */
  updateFollowUp: protectedProcedure.input(z4.object({
    id: z4.number().int(),
    followUpDate: z4.string().nullable(),
    followUpNote: z4.string().max(500).nullable()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError5({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(calculatorLeads).set({
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      followUpNote: input.followUpNote
    }).where(eq4(calculatorLeads.id, input.id));
    return { success: true };
  }),
  /**
   * Protected mutation — update pipeline status for a lead
   */
  updateStatus: protectedProcedure.input(z4.object({ id: z4.number().int(), status: z4.enum(["new", "contacted", "converted", "not_interested"]) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError5({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(calculatorLeads).set({ leadStatus: input.status }).where(eq4(calculatorLeads.id, input.id));
    return { success: true };
  }),
  /**
   * Protected query — get all SMS jobs for admin dashboard
   */
  getSmsJobs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError5({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const jobs = await db.select({
      id: smsJobs.id,
      leadId: smsJobs.leadId,
      phone: smsJobs.phone,
      message: smsJobs.message,
      smsNumber: smsJobs.smsNumber,
      sendAt: smsJobs.sendAt,
      sentAt: smsJobs.sentAt,
      status: smsJobs.status,
      errorMessage: smsJobs.errorMessage,
      messageId: smsJobs.messageId,
      createdAt: smsJobs.createdAt,
      leadName: calculatorLeads.name
    }).from(smsJobs).leftJoin(calculatorLeads, eq4(smsJobs.leadId, calculatorLeads.id)).orderBy(smsJobs.sendAt);
    return jobs;
  }),
  /**
   * Protected mutation — retry a failed SMS job
   */
  retrySmsJob: protectedProcedure.input(z4.object({ id: z4.number().int() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError5({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(smsJobs).set({ status: "pending", sendAt: /* @__PURE__ */ new Date(), errorMessage: null, sentAt: null }).where(eq4(smsJobs.id, input.id));
    return { success: true };
  }),
  /**
   * Public mutation — submit calculator and trigger SMS automation
   * Accepts pre-calculated results from the frontend to ensure SMS matches what the user saw
   */
  submit: publicProcedure.input(
    z4.object({
      name: z4.string().min(2).max(255),
      email: z4.string().email(),
      phone: z4.string().min(1).max(30).optional(),
      age: z4.number().int().min(13).max(120),
      weight: z4.number().min(30).max(300),
      height: z4.number().int().min(100).max(250),
      // Goal selected by user
      goal: z4.enum(["extremeCut", "moderateCut", "maintain", "leanBulk"]).default("maintain"),
      // Referral code if the user arrived via a referral link
      referredBy: z4.string().max(32).optional(),
      // Pre-calculated results from the frontend — used directly in SMS
      tdee: z4.number().int().min(500).max(1e4),
      bmr: z4.number().int().min(500).max(1e4),
      protein: z4.number().int().min(0).max(1e3),
      carbs: z4.number().int().min(0).max(2e3),
      fats: z4.number().int().min(0).max(1e3)
    })
  ).mutation(async ({ input }) => {
    try {
      console.log("[Calculator] Received input:", input);
      const { tdee, bmr, protein, carbs, fats, goal } = input;
      const goalLabels = {
        extremeCut: "Extreme Cut (-750 cal)",
        moderateCut: "Moderate Cut (-400 cal)",
        maintain: "Maintain",
        leanBulk: "Lean Bulk (+250 cal)"
      };
      const goalLabel = goalLabels[goal] ?? goal;
      console.log("[Calculator] Using frontend-calculated macros:", { tdee, bmr, protein, carbs, fats });
      const db = await getDb();
      if (!db) {
        console.error("[Calculator] Database connection failed");
        throw new TRPCError5({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed"
        });
      }
      console.log("[Calculator] Inserting lead into database...");
      const result = await db.insert(calculatorLeads).values({
        name: input.name,
        email: input.email,
        phone: input.phone || "unknown",
        age: input.age,
        weight: input.weight,
        height: input.height,
        goal,
        tdee,
        bmr,
        protein,
        carbs,
        fats,
        smsStatus: "pending",
        referredBy: input.referredBy ? input.referredBy.toUpperCase() : null
      });
      console.log("[Calculator] Insert result:", JSON.stringify(result));
      let leadId = 0;
      if (Array.isArray(result) && result[0]?.insertId) {
        leadId = Number(result[0].insertId);
      } else if (result?.insertId) {
        leadId = Number(result.insertId);
      }
      console.log("[Calculator] Extracted leadId:", leadId, "from result:", result);
      if (!leadId || leadId === 0) {
        console.error("[Calculator] Failed to get lead ID from insert result, result was:", result);
        throw new TRPCError5({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create calculator lead"
        });
      }
      console.log("[Calculator] Lead created with ID:", leadId);
      const notifyContent = `New calculator lead!

Name: ${input.name}
Email: ${input.email}
Phone: ${input.phone || "not provided"}
Goal: ${goalLabel}

Macros:
\u2022 Calories: ${tdee} kcal/day
\u2022 Protein: ${protein}g
\u2022 Carbs: ${carbs}g
\u2022 Fats: ${fats}g

Age: ${input.age} | Weight: ${input.weight}kg | Height: ${input.height}cm`;
      notifyOwner({
        title: `\u{1F3AF} New LFF Lead: ${input.name}`,
        content: notifyContent
      }).catch((e) => console.warn("[Notify] Manus notification failed:", e));
      sendEmail({
        to: "loverfighterfitness@gmail.com",
        subject: `\u{1F3AF} New LFF Lead: ${input.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f7f2; border-radius: 12px;">
              <h2 style="color: #54412F; margin-bottom: 4px;">New Calculator Lead \u{1F3AF}</h2>
              <p style="color: #888; margin-top: 0;">Someone just used the macro calculator on your website.</p>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold; width: 120px;">Name</td><td style="padding: 8px 0; color: #333;">${input.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Email</td><td style="padding: 8px 0; color: #333;">${input.email}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Phone</td><td style="padding: 8px 0; color: #333;">${input.phone || "not provided"}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Goal</td><td style="padding: 8px 0; color: #333;">${goalLabel}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Age</td><td style="padding: 8px 0; color: #333;">${input.age}</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Weight</td><td style="padding: 8px 0; color: #333;">${input.weight}kg</td></tr>
                <tr><td style="padding: 8px 0; color: #54412F; font-weight: bold;">Height</td><td style="padding: 8px 0; color: #333;">${input.height}cm</td></tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <h3 style="color: #54412F; margin-bottom: 12px;">Their Macros</h3>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="background: #54412F; color: #EAE6D2; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${tdee}</div>
                  <div style="font-size: 12px; opacity: 0.7;">CALORIES</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${protein}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">PROTEIN</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${carbs}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">CARBS</div>
                </div>
                <div style="background: #EAE6D2; color: #54412F; padding: 16px 24px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold;">${fats}g</div>
                  <div style="font-size: 12px; opacity: 0.7;">FATS</div>
                </div>
              </div>
              <hr style="border: none; border-top: 1px solid #e0ddd5; margin: 20px 0;" />
              <p style="color: #888; font-size: 13px;">SMS #1 has been sent automatically. SMS #2 fires in 2 days, SMS #3 in 5 days.</p>
            </div>
          `
      }).catch((e) => console.warn("[Email] Notification failed:", e));
      (async () => {
        try {
          const subs = await db.select().from(pushSubscriptions);
          for (const sub of subs) {
            const result2 = await sendPushNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              {
                title: `\u{1F3AF} New Lead: ${input.name}`,
                body: `${goalLabel} \xB7 ${tdee} cal \xB7 ${protein}g protein`,
                url: "/admin/leads"
              }
            );
            if (result2.error === "subscription_expired") {
              await db.delete(pushSubscriptions).where(eq4(pushSubscriptions.endpoint, sub.endpoint));
            }
          }
        } catch (e) {
          console.warn("[Push] Notification failed:", e);
        }
      })();
      console.log("[Calculator] Phone number:", input.phone, "Lead ID:", leadId);
      if (input.phone && leadId > 0) {
        console.log("[Calculator] Sending SMS #1 to", input.phone);
        const sms1Message = formatSMS1(input.name, tdee, protein, carbs, fats, "https://www.loverfighterfitness.com/calculator");
        try {
          const sms1Result = await sendSMS({ phone: input.phone, message: sms1Message });
          if (sms1Result.success) {
            console.log("[Calculator] SMS #1 sent successfully, message ID:", sms1Result.messageId);
            await db.update(calculatorLeads).set({
              sms1SentAt: /* @__PURE__ */ new Date(),
              sms1MessageId: sms1Result.messageId
            }).where(eq4(calculatorLeads.id, leadId));
          } else {
            console.error("[Calculator] SMS #1 failed:", sms1Result.error);
          }
        } catch (smsError) {
          console.error("[Calculator] Error sending SMS #1:", smsError);
        }
        await enqueueSmsJob({
          leadId,
          phone: input.phone,
          message: formatSMS2(input.name),
          smsNumber: 2,
          delayMs: 2 * 24 * 60 * 60 * 1e3
        });
        await enqueueSmsJob({
          leadId,
          phone: input.phone,
          message: formatSMS3(input.name, "https://tinyurl.com/yov35eof"),
          smsNumber: 3,
          delayMs: 5 * 24 * 60 * 60 * 1e3
        });
      }
      return {
        success: true,
        results: {
          tdee,
          bmr,
          protein,
          carbs,
          fats
        }
      };
    } catch (error) {
      console.error("[Calculator] Failed to submit:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: `Calculator error: ${errorMsg}`
      });
    }
  })
});

// server/routers/push.ts
import { z as z5 } from "zod";
import { eq as eq5 } from "drizzle-orm";
var pushRouter = router({
  /**
   * Public mutation — save a push subscription from the browser
   */
  subscribe: publicProcedure.input(
    z5.object({
      endpoint: z5.string().url(),
      keys: z5.string(),
      // JSON string of {p256dh, auth}
      userAgent: z5.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const existing = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq5(pushSubscriptions.endpoint, input.endpoint)).limit(1);
    if (existing.length > 0) {
      await db.update(pushSubscriptions).set({ keys: input.keys, userAgent: input.userAgent }).where(eq5(pushSubscriptions.endpoint, input.endpoint));
    } else {
      await db.insert(pushSubscriptions).values({
        endpoint: input.endpoint,
        keys: input.keys,
        userAgent: input.userAgent
      });
    }
    return { success: true };
  }),
  /**
   * Public mutation — remove a push subscription (when user denies permission)
   */
  unsubscribe: publicProcedure.input(z5.object({ endpoint: z5.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.delete(pushSubscriptions).where(eq5(pushSubscriptions.endpoint, input.endpoint));
    return { success: true };
  })
});

// server/routers/stripe.ts
import Stripe from "stripe";
import { z as z6 } from "zod";

// server/stripe/products.ts
var STRIPE_PRODUCTS = {
  standardCoaching: {
    name: "Online Coaching",
    description: "Full-service online coaching \u2014 $80/week",
    priceId: "price_1T7vYLELc7CqpluZxV5Q5X51",
    paymentLinkUrl: "https://buy.stripe.com/3cI00j4Aq0bdf3S08Mbwk04"
  },
  compPrepCoaching: {
    name: "Comp Prep Coaching",
    description: "Competition prep coaching \u2014 $120/week",
    priceId: "price_1T7vboELc7CqpluZc8Vcr08B",
    paymentLinkUrl: "https://buy.stripe.com/3cI9AT9UK7DFaNC1cQbwk05"
  }
};

// server/routers/stripe.ts
function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}
var stripeRouter = router({
  createCheckoutSession: publicProcedure.input(
    z6.object({
      productKey: z6.enum(["standardCoaching", "compPrepCoaching"]),
      origin: z6.string().url(),
      // Referral code — if present, apply the 2-weeks-free coupon
      referralCode: z6.string().max(32).optional()
    })
  ).mutation(async ({ input }) => {
    const stripe = getStripe();
    const product = STRIPE_PRODUCTS[input.productKey];
    const sessionParams = {
      mode: "subscription",
      line_items: [
        {
          price: product.priceId,
          quantity: 1
        }
      ],
      payment_method_types: ["card"],
      success_url: `${input.origin}/success?session_id={CHECKOUT_SESSION_ID}&package=${input.productKey}${input.referralCode ? `&ref=${input.referralCode}` : ""}`,
      cancel_url: `${input.origin}/#coaching`,
      allow_promotion_codes: !input.referralCode,
      // disable manual promo codes when referral coupon is applied
      metadata: {
        product_key: input.productKey,
        product_name: product.name,
        referral_code: input.referralCode ?? ""
      }
    };
    if (input.referralCode) {
      sessionParams.discounts = [{ coupon: "LFF_REFERRAL_2WEEKS" }];
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  })
});

// server/routers/referral.ts
import { z as z7 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";
import { eq as eq6, sql } from "drizzle-orm";
var referralRouter = router({
  /**
   * Public — validate a referral code exists and is active.
   * Called when someone lands on /ref/[code] to confirm the code is valid.
   */
  validate: publicProcedure.input(z7.object({ code: z7.string().min(1).max(32) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { valid: false, referrerName: null };
    const rows = await db.select({ id: referralCodes.id, referrerName: referralCodes.referrerName, active: referralCodes.active }).from(referralCodes).where(eq6(referralCodes.code, input.code.toUpperCase())).limit(1);
    if (!rows.length || rows[0].active !== "yes") return { valid: false, referrerName: null };
    return { valid: true, referrerName: rows[0].referrerName };
  }),
  /**
   * Admin — get all referral codes with usage counts.
   */
  getCodes: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError6({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const codes = await db.select().from(referralCodes).orderBy(referralCodes.createdAt);
    const usageCounts = await db.select({
      referredBy: calculatorLeads.referredBy,
      count: sql`count(*)`.as("count")
    }).from(calculatorLeads).groupBy(calculatorLeads.referredBy);
    const usageMap = {};
    for (const row of usageCounts) {
      if (row.referredBy) usageMap[row.referredBy] = Number(row.count);
    }
    return codes.map((c) => ({
      ...c,
      usageCount: usageMap[c.code] ?? 0
    }));
  }),
  /**
   * Admin — get leads that came from a specific referral code.
   */
  getLeadsForCode: protectedProcedure.input(z7.object({ code: z7.string() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError6({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    return db.select({
      id: calculatorLeads.id,
      name: calculatorLeads.name,
      email: calculatorLeads.email,
      phone: calculatorLeads.phone,
      goal: calculatorLeads.goal,
      leadStatus: calculatorLeads.leadStatus,
      createdAt: calculatorLeads.createdAt
    }).from(calculatorLeads).where(eq6(calculatorLeads.referredBy, input.code.toUpperCase())).orderBy(calculatorLeads.createdAt);
  }),
  /**
   * Admin — create a new referral code.
   */
  createCode: protectedProcedure.input(z7.object({
    code: z7.string().min(2).max(32).regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, hyphens, or underscores"),
    referrerName: z7.string().min(1).max(255),
    notes: z7.string().max(500).optional()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError6({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    try {
      await db.insert(referralCodes).values({
        code: input.code.toUpperCase(),
        referrerName: input.referrerName,
        notes: input.notes ?? null
      });
      return { success: true };
    } catch (e) {
      if (e?.message?.includes("Duplicate")) {
        throw new TRPCError6({ code: "CONFLICT", message: "That code already exists" });
      }
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
  /**
   * Admin — toggle a referral code active/inactive.
   */
  toggleCode: protectedProcedure.input(z7.object({ id: z7.number().int(), active: z7.boolean() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError6({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(referralCodes).set({ active: input.active ? "yes" : "no" }).where(eq6(referralCodes.id, input.id));
    return { success: true };
  }),
  /**
   * Admin — delete a referral code.
   */
  deleteCode: protectedProcedure.input(z7.object({ id: z7.number().int() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError6({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(referralCodes).where(eq6(referralCodes.id, input.id));
    return { success: true };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  storage: storageRouter,
  leads: leadsRouter,
  calculator: calculatorRouter,
  push: pushRouter,
  stripe: stripeRouter,
  referral: referralRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/stripe/webhook.ts
import Stripe2 from "stripe";
async function handleStripeWebhook(req, res) {
  const stripe = new Stripe2(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }
  console.log(`[Webhook] Event received: ${event.type} (${event.id})`);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const productName = session.metadata?.product_name ?? "Unknown Package";
      const customerEmail = session.customer_details?.email ?? "unknown";
      const customerName = session.customer_details?.name ?? "Unknown";
      const amountPaid = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)} AUD` : "unknown";
      console.log(
        `[Webhook] Payment completed: ${productName} by ${customerName} (${customerEmail}) \u2014 ${amountPaid}`
      );
      await notifyOwner({
        title: `\u{1F4AA} New Client Payment \u2014 ${productName}`,
        content: `${customerName} (${customerEmail}) just paid ${amountPaid} for ${productName}. Check your Stripe dashboard and reach out within 24 hours.`
      });
      break;
    }
    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
  res.json({ received: true });
}

// server/_core/index.ts
import path3 from "path";
import { fileURLToPath } from "url";
var __dirname = path3.dirname(fileURLToPath(import.meta.url));
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.post("/api/stripe/webhook", express2.raw({ type: "application/json" }), handleStripeWebhook);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startSmsScheduler();
  });
}
startServer().catch(console.error);
