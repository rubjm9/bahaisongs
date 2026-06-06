import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { signedPutUrl, DEFAULT_UPLOAD_TTL_SECONDS } from '@/shared/lib/r2/signing';

export const runtime = 'edge';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasR2Config(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_AUDIO
  );
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'audio.mp3';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned.toLowerCase().endsWith('.mp3') ? cleaned : `${cleaned}.mp3`;
}

export async function POST(req: NextRequest) {
  if (!hasR2Config()) {
    return NextResponse.json({ error: 'r2-not-configured' }, { status: 503 });
  }

  let body: { suggestionId?: string; filename?: string; contentType?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const suggestionId = body.suggestionId?.trim();
  const filename = body.filename?.trim();
  const contentType = body.contentType?.trim() ?? 'audio/mpeg';

  if (!suggestionId || !UUID_RE.test(suggestionId)) {
    return NextResponse.json({ error: 'invalid-suggestion-id' }, { status: 400 });
  }

  if (!filename) {
    return NextResponse.json({ error: 'missing-filename' }, { status: 400 });
  }

  if (!contentType.startsWith('audio/')) {
    return NextResponse.json({ error: 'invalid-content-type' }, { status: 400 });
  }

  const safeName = sanitizeFilename(filename);
  const uploadPath = `incoming/${suggestionId}/${safeName}`;

  try {
    const bucket = process.env.R2_BUCKET_AUDIO!;
    const uploadUrl = await signedPutUrl(bucket, uploadPath, contentType);
    const expiresAt = new Date(Date.now() + DEFAULT_UPLOAD_TTL_SECONDS * 1000).toISOString();
    return NextResponse.json({ uploadUrl, uploadPath, expiresAt });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'sign-failed', detail }, { status: 500 });
  }
}
