import { getFilteredMovies } from "@/lib/api";
import { getSiteUrl } from "@/lib/env";

const CHUNK = 1000;

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const page = Math.max(1, parseInt((await params).page, 10) || 1);
  const res = await getFilteredMovies({ per_page: CHUNK, page }).catch(() => ({ data: [] }));
  const urls = (res.data ?? []).map((m) => ({ url: `${getSiteUrl()}/phim/${m.slug}`, lastModified: new Date() }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u.url}</loc></url>`).join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
