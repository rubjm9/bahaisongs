function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const r2Env = {
  accountId: () => required('R2_ACCOUNT_ID'),
  accessKeyId: () => required('R2_ACCESS_KEY_ID'),
  secretAccessKey: () => required('R2_SECRET_ACCESS_KEY'),
  bucketAudio: () => required('R2_BUCKET_AUDIO'),
  bucketImages: () => required('R2_BUCKET_IMAGES'),
  publicCdnBaseUrl: () => process.env.R2_PUBLIC_CDN_BASE_URL ?? '',
  endpoint: () => `https://${required('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
} as const;
