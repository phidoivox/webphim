import type { MovieDetail } from "@/types/movie";

interface MovieJsonLdProps {
  movie: MovieDetail;
}

/**
 * Component tạo dữ liệu có cấu trúc Schema.org JSON-LD (Movie / TVSeries / AggregateRating)
 * giúp Google Search hiển thị Rich Snippets (Sao đánh giá, đạo diễn, diễn viên, ảnh bìa).
 */
export default function MovieJsonLd({ movie }: MovieJsonLdProps) {
  const isSeries = movie.type === "series" || movie.type === "tv-show";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isSeries ? "TVSeries" : "Movie",
    name: movie.name,
    alternateName: movie.originName || undefined,
    description: movie.content || `${movie.name} full HD Vietsub Thuyết minh mới nhất.`,
    image: [movie.posterUrl, movie.thumbUrl].filter(Boolean),
    datePublished: movie.year ? `${movie.year}-01-01` : undefined,
    genre: movie.genres && movie.genres.length > 0 ? movie.genres : undefined,
    inLanguage: movie.lang || "vi",
    ...(movie.ratingCount > 0 && movie.ratingAvg > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: movie.ratingAvg.toFixed(1),
            bestRating: "10",
            worstRating: "1",
            ratingCount: movie.ratingCount,
          },
        }
      : {}),
    ...(movie.credits?.directors && movie.credits.directors.length > 0
      ? {
          director: movie.credits.directors.map((d) => ({
            "@type": "Person",
            name: d.name,
          })),
        }
      : {}),
    ...(movie.credits?.actors && movie.credits.actors.length > 0
      ? {
          actor: movie.credits.actors.map((a) => ({
            "@type": "Person",
            name: a.name,
          })),
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
