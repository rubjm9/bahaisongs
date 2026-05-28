import { AwsClient } from 'aws4fetch';
import { r2Env } from './env';

/** Default TTL for read URLs — 1 hour. */
export const DEFAULT_READ_TTL_SECONDS = 60 * 60;
/** Default TTL for upload (PUT) URLs — 5 minutes. */
export const DEFAULT_UPLOAD_TTL_SECONDS = 5 * 60;

function client(): AwsClient {
  return new AwsClient({
    accessKeyId: r2Env.accessKeyId(),
    secretAccessKey: r2Env.secretAccessKey(),
    service: 's3',
    region: 'auto',
  });
}

function objectUrl(bucket: string, key: string): string {
  return `${r2Env.endpoint()}/${bucket}/${encodeURI(key)}`;
}

export interface SignOptions {
  ttlSeconds?: number;
}

/**
 * Build a pre-signed GET URL for an R2 object using SigV4 query signing.
 */
export async function signedGetUrl(
  bucket: string,
  key: string,
  opts: SignOptions = {},
): Promise<string> {
  const ttl = opts.ttlSeconds ?? DEFAULT_READ_TTL_SECONDS;
  const url = new URL(objectUrl(bucket, key));
  url.searchParams.set('X-Amz-Expires', String(ttl));
  const signed = await client().sign(new Request(url, { method: 'GET' }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

/**
 * Build a pre-signed PUT URL for direct browser → R2 uploads.
 * Caller must use the same content-type when issuing the PUT.
 */
export async function signedPutUrl(
  bucket: string,
  key: string,
  contentType: string,
  opts: SignOptions = {},
): Promise<string> {
  const ttl = opts.ttlSeconds ?? DEFAULT_UPLOAD_TTL_SECONDS;
  const url = new URL(objectUrl(bucket, key));
  url.searchParams.set('X-Amz-Expires', String(ttl));
  const signed = await client().sign(
    new Request(url, { method: 'PUT', headers: { 'Content-Type': contentType } }),
    { aws: { signQuery: true } },
  );
  return signed.url;
}
