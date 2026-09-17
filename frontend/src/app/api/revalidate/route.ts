import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

// Tags/paths cho phép purge on-demand — khớp MovieObserver::invalidateFor().
const ALLOWED_TAGS = new Set(['home', 'movies', 'schedule', 'genres', 'taxonomy', 'countries']);
const isMovieTag = (tag: string): boolean => tag === 'movies' || tag.startsWith('movie-');

function getSecret(): string | null {
  const secret = process.env.REVALIDATION_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

function isAuthorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get('authorization');
  const presented = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function filterTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(
    (t): t is string => typeof t === 'string' && (ALLOWED_TAGS.has(t) || isMovieTag(t))
  );
}

function isAllowedPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('..');
}

export async function POST(request: NextRequest) {
  const secret = getSecret();
  if (!secret) {
    return NextResponse.json({ message: 'Revalidation not configured' }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ message: 'Invalid token / secret' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tags = filterTags(body.tags ?? body.tag);
    const rawPath = typeof body.path === 'string' ? body.path : null;
    const path = rawPath && isAllowedPath(rawPath) ? rawPath : null;

    if (tags.length === 0 && !path) {
      return NextResponse.json(
        { message: 'Missing tag(s) or path to revalidate' },
        { status: 400 }
      );
    }

    const revalidatedTags: string[] = [];

    for (const t of tags) {
      revalidateTag(t, { expire: 0 });
      revalidatedTags.push(t);
    }

    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      tags: revalidatedTags,
      path: path || null,
      now: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const secret = getSecret();
  if (!secret) {
    return NextResponse.json({ message: 'Revalidation not configured' }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ message: 'Invalid token / secret' }, { status: 401 });
  }

  const tags = filterTags(request.nextUrl.searchParams.get('tag'));
  const rawPath = request.nextUrl.searchParams.get('path');
  const path = rawPath && isAllowedPath(rawPath) ? rawPath : null;

  if (tags.length === 0 && !path) {
    return NextResponse.json({ message: 'Missing tag or path' }, { status: 400 });
  }

  for (const t of tags) {
    revalidateTag(t, { expire: 0 });
  }

  if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tags,
    path: path || null,
    now: Date.now(),
  });
}
