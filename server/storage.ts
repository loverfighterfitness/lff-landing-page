/**
 * Storage helpers — S3 uploads via AWS SDK (replaces Manus Forge proxy).
 * Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION env vars.
 * If not configured, upload operations throw a descriptive error.
 */

function getS3Config() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "ap-southeast-2";

  if (!bucket) {
    throw new Error(
      "S3 storage not configured: set S3_BUCKET (and optionally S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
    );
  }

  return { bucket, region };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { bucket, region } = getS3Config();

  const key = normalizeKey(relKey);
  const body = typeof data === "string" ? Buffer.from(data) : data;

  const client = new S3Client({ region });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Return a public URL (assumes bucket has public read or CloudFront)
  const cdnBase = process.env.S3_CDN_URL;
  const url = cdnBase
    ? `${cdnBase.replace(/\/+$/, "")}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const { bucket, region } = getS3Config();
  const key = normalizeKey(relKey);

  const cdnBase = process.env.S3_CDN_URL;
  const url = cdnBase
    ? `${cdnBase.replace(/\/+$/, "")}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { key, url };
}
