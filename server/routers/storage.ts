/**
 * Storage router — admin-only procedures for managing media assets.
 * Files are stored in S3 via storagePut; metadata is persisted in the DB.
 */
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { mediaAssets } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const storageRouter = router({
  /**
   * Upload a file — accepts base64-encoded file data from the client.
   * Admin only.
   */
  upload: adminProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        mimeType: z.string().min(1),
        /** Base64-encoded file content */
        data: z.string().min(1),
        fileSize: z.number().int().positive(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Decode base64
      const buffer = Buffer.from(input.data, "base64");

      // Build a unique key: lff-media/<nanoid>-<filename>
      const ext = input.filename.split(".").pop() ?? "bin";
      const fileKey = `lff-media/${nanoid(10)}-${Date.now()}.${ext}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Persist metadata
      await db.insert(mediaAssets).values({
        fileKey,
        url,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        label: input.label ?? null,
        uploadedBy: ctx.user.id,
      });

      return { fileKey, url, filename: input.filename };
    }),

  /**
   * List all uploaded media assets. Admin only.
   */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const assets = await db
      .select()
      .from(mediaAssets)
      .orderBy(mediaAssets.createdAt);

    return assets;
  }),

  /**
   * Delete a media asset record (does not delete from S3 — files are public CDN).
   * Admin only.
   */
  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.delete(mediaAssets).where(eq(mediaAssets.id, input.id));
      return { success: true };
    }),
});
