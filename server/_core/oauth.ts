/**
 * Auth routes — no-op (auth removed, single-user site).
 */
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // No auth routes needed — admin pages are open.
}
