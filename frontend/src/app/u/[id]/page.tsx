import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getPublicProfileApi } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await getPublicProfileApi(Number(id));
    const title = `${data.user.name} — Hồ sơ & Bộ sưu tập phim | WebPhim`;
    const description =
      data.collections.length > 0
        ? `Xem ${data.collections.length} bộ sưu tập phim của ${data.user.name}: ${data.collections.slice(0, 3).map((c) => c.name).join(", ")}.`
        : `Hồ sơ người dùng ${data.user.name} trên WebPhim.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: data.user.avatarUrl ? [{ url: data.user.avatarUrl }] : undefined,
      },
    };
  } catch {
    return { title: "Không tìm thấy người dùng | WebPhim" };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  let data;
  try {
    data = await getPublicProfileApi(userId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { user, collections } = data;
  const joined = user.createdAt
    ? `Thành viên từ tháng ${new Date(user.createdAt).getMonth() + 1}/${new Date(user.createdAt).getFullYear()}`
    : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/40 bg-white/10 text-xl font-extrabold text-accent">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            user.name.trim().charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">{user.name}</h1>
            {(user.subscriptionType === "vip" || user.subscriptionType === "premium") && (
              <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                VIP
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/50">{joined}</p>
          <p className="mt-1 text-xs font-semibold text-white/70">
            {collections.length} bộ sưu tập công khai
          </p>
        </div>
      </header>

      {collections.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/50">
          Người dùng này chưa chia sẻ bộ sưu tập công khai nào.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/bo-suu-tap/${c.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-accent/50"
            >
              <div className="flex gap-3 p-4">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {c.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbUrl} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">🎬</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-white group-hover:text-accent">{c.name}</h2>
                  {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{c.description}</p>}
                  <p className="mt-1 text-[11px] font-semibold text-white/60">{c.moviesCount} phim</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
