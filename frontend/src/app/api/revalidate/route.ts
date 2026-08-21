import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.nextUrl.searchParams.get('secret');

    const expectedSecret = process.env.REVALIDATION_SECRET || 'webphim_secret_revalidate_2026';

    if (secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid token / secret' }, { status: 401 });
    }

    const tag = body.tag || request.nextUrl.searchParams.get('tag');
    const path = body.path || request.nextUrl.searchParams.get('path');
    const tags: string[] = body.tags || (tag ? [tag] : []);

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
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATION_SECRET || 'webphim_secret_revalidate_2026';

  if (secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid token / secret' }, { status: 401 });
  }

  const tag = request.nextUrl.searchParams.get('tag');
  const path = request.nextUrl.searchParams.get('path');

  if (!tag && !path) {
    return NextResponse.json({ message: 'Missing tag or path' }, { status: 400 });
  }

  if (tag) {
    revalidateTag(tag, { expire: 0 });
  }

  if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    tag: tag || null,
    path: path || null,
    now: Date.now(),
  });
}
