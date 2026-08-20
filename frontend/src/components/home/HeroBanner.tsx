"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PlayIcon,
  InfoIcon,
  HeartIcon,
  Volume2Icon,
  VolumeXIcon,
} from "@/components/ui/icons";
import { QualityBadge } from "@/components/ui/QualityBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { GenreBadge } from "@/components/ui/GenreBadge";
import type { HeroMovie } from "@/types/movie";
import { useBookmark } from "@/hooks/useBookmark";

const SLIDE_DURATION = 7000; // 7 seconds per slide

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function isDirectVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(url);
}

export default function HeroBanner({ movies }: { movies: HeroMovie[] }) {
  const [active, setActive] = useState(0);
  const { isMovieFavorite, toggleBookmark } = useBookmark();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBannerInView, setIsBannerInView] = useState(true);

  const bannerRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 1. IntersectionObserver & Page Visibility API (Tối ưu hiệu năng, ngắt khi cuộn qua hoặc đổi tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsBannerInView(false);
      } else {
        setIsBannerInView(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBannerInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  // 2. Timer 2s trễ trước khi kích hoạt trailer như Netflix
  useEffect(() => {
    setIsVideoPlaying(false);
    setIsMuted(true); // Reset về muted khi đổi slide

    const currentMovie = movies[active];
    if (!currentMovie?.trailerUrl || !isBannerInView) return;

    const timer = setTimeout(() => {
      setIsVideoPlaying(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [active, movies, isBannerInView]);

  // 3. Tự động chuyển slide (tạm dừng khi trailer đang phát hoặc khi cuộn khỏi màn hình)
  useEffect(() => {
    if (movies.length <= 1 || isVideoPlaying || !isBannerInView) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % movies.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [movies.length, isVideoPlaying, isBannerInView]);

  const selectSlide = (index: number) => {
    setActive(index);
  };

  // 4. Bật / Tắt âm thanh thời gian thực qua postMessage (Không reload iframe / video)
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: nextMuted ? "mute" : "unMute",
            args: [],
          }),
          "*"
        );
        if (!nextMuted) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: "command",
              func: "setVolume",
              args: [100],
            }),
            "*"
          );
        }
      }
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
      }
      return nextMuted;
    });
  }, []);

  if (!movies || movies.length === 0) return null;

  const movie = movies[active];
  const ytId = extractYouTubeId(movie.trailerUrl);
  const isDirect = isDirectVideo(movie.trailerUrl);

  return (
    <section
      ref={bannerRef}
      className="relative w-full h-[75vh] min-h-[540px] max-h-[850px] lg:h-[88vh] overflow-hidden select-none bg-base group"
    >
      {/* ═══════════════ 1. BACKGROUND POSTER / BACKDROP LAYER ═══════════════ */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {movies.map((m, idx) => (
          <div
            key={m.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
              idx === active ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
          >
            <Image
              src={m.thumbUrl}
              alt={m.name}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      {/* ═══════════════ 2. VIDEO TRAILER PREVIEW LAYER (NETFLIX STYLE) ═══════════════ */}
      {isBannerInView && movie.trailerUrl && (
        <div
          key={`trailer-${movie.id}`}
          className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ease-in-out pointer-events-none ${
            isVideoPlaying ? "opacity-100 z-[1]" : "opacity-0 -z-10"
          }`}
          style={{ willChange: "opacity" }}
        >
          {ytId ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${ytId}&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1`}
                title={`${movie.name} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-[135vw] h-[135vh] min-w-[177.77vh] min-h-[56.25vw] object-cover scale-125 sm:scale-135 pointer-events-none select-none border-0"
              />
            </div>
          ) : isDirect ? (
            <video
              ref={videoRef}
              src={movie.trailerUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
              <iframe
                ref={iframeRef}
                src={movie.trailerUrl}
                title={`${movie.name} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-[135vw] h-[135vh] min-w-[177.77vh] min-h-[56.25vw] object-cover scale-125 sm:scale-135 pointer-events-none select-none border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ 3. VIGNETTE GRADIENT OVERLAYS ═══════════════ */}
      {/* Soft Bottom Ground Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/30 to-transparent z-10 pointer-events-none" />

      {/* Top Header Bar Blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-base/70 via-transparent to-transparent z-10 h-28 pointer-events-none" />

      {/* ═══════════════ 4. MAIN BANNER CONTENT ═══════════════ */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-end pb-12 lg:pb-16">
        <div key={movie.id} className="max-w-xl space-y-2.5 sm:space-y-3">
          {/* Main Title Typography */}
          <div className="space-y-0.5">
            <h1 className="animate-slide-right font-display text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-[1.1] [animation-delay:40ms]">
              {movie.name}
            </h1>
            {movie.originName && (
              <p
                style={{ color: "#fbbf24" }}
                className="animate-slide-right font-medium text-xs sm:text-sm tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] [animation-delay:80ms]"
              >
                {movie.originName}
              </p>
            )}
          </div>

          {/* Badges Row */}
          <div className="animate-slide-right flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] [animation-delay:120ms]">
            {movie.ratingAvg !== undefined && movie.ratingAvg !== null && (
              <RatingBadge provider="TMDb" rating={movie.ratingAvg} />
            )}
            {movie.imdbRating !== undefined && movie.imdbRating !== null && (
              <RatingBadge provider="IMDb" rating={movie.imdbRating} />
            )}
            {movie.year && (
              <span className="px-1.5 py-0.5 rounded-md border border-white/30 text-white font-medium bg-black/40 backdrop-blur-sm shadow-sm">
                {movie.year}
              </span>
            )}
            {movie.episodeLabel && (
              <span className="px-1.5 py-0.5 rounded-md border border-white/30 text-white font-medium bg-black/40 backdrop-blur-sm shadow-sm">
                {movie.episodeLabel}
              </span>
            )}
            <QualityBadge quality={movie.quality || "HD"} />
          </div>

          {/* Reusable Genre Badges */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="animate-slide-right flex flex-wrap items-center gap-1.5 [animation-delay:140ms]">
              {movie.genres.map((g) => (
                <GenreBadge key={g} name={g} />
              ))}
            </div>
          )}

          {/* Description */}
          <p
            style={{ color: "#ffffff" }}
            className="animate-slide-right text-xs sm:text-sm font-normal text-white max-w-md md:max-w-lg line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] [animation-delay:160ms]"
          >
            {movie.description}
          </p>

          {/* ChoPhim Style Floating Action Capsule Bar */}
          <div className="animate-slide-right pt-1.5 [animation-delay:200ms]">
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-surface/50 border border-white/15 backdrop-blur-xl shadow-xl">
              {/* Orange Play Button */}
              <Link
                href={`/xem/${movie.slug}/${movie.firstEpisodeSlug || "tap-1"}`}
                aria-label="Xem ngay"
                className="w-10 h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-md shadow-accent/40 transform hover:scale-105 active:scale-95 transition-all group/play"
              >
                <PlayIcon className="w-5 h-5 fill-current transition-transform group-hover/play:scale-110 ml-0.5" />
              </Link>

              {/* Heart / Favorite Button */}
              <button
                type="button"
                onClick={() => {
                  void toggleBookmark(
                    {
                      id: movie.id,
                      name: movie.name,
                      originName: movie.originName,
                      slug: movie.slug,
                      posterUrl: movie.posterUrl,
                      thumbUrl: movie.thumbUrl,
                      year: movie.year,
                      quality: movie.quality,
                      ratingAvg: movie.ratingAvg,
                      genres: movie.genres,
                    },
                    "favorite"
                  );
                }}
                aria-label={isMovieFavorite(movie.id) ? "Bỏ yêu thích" : "Yêu thích"}
                title={isMovieFavorite(movie.id) ? "Bỏ yêu thích" : "Yêu thích"}
                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all border transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isMovieFavorite(movie.id)
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-400 scale-105"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                }`}
              >
                <HeartIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMovieFavorite(movie.id) ? "fill-rose-400 text-rose-400 scale-110" : ""
                  }`}
                />
              </button>

              {/* Information / Details Button */}
              <Link
                href={`/phim/${movie.slug}`}
                aria-label="Thông tin phim"
                className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 transform hover:scale-105 active:scale-95"
              >
                <InfoIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ 5. FLOATING MUTE / UNMUTE CONTROL (NETFLIX STYLE) ═══════════════ */}
      {isVideoPlaying && movie.trailerUrl && isBannerInView && (
        <div className="absolute bottom-16 sm:bottom-20 right-4 sm:right-6 lg:right-10 z-30 transition-all duration-300 animate-fade-in">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="group/sound flex items-center justify-center p-1.5 text-white/90 hover:text-white transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer"
          >
            {isMuted ? (
              <VolumeXIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-transform group-hover/sound:scale-110" />
            ) : (
              <Volume2Icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-transform group-hover/sound:scale-110" />
            )}
          </button>
        </div>
      )}

      {/* ═══════════════ 6. FLOATING FILMSTRIP CAROUSEL BAR ═══════════════ */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:right-6 lg:right-10 z-30 flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/15 rounded-2xl backdrop-blur-md shadow-2xl">
            {movies.map((m, idx) => {
              const isActive = idx === active;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectSlide(idx)}
                  className={`group/thumb relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "border-2 border-accent shadow-lg shadow-accent/25 scale-105 opacity-100 w-14 sm:w-16 h-9 sm:h-10"
                      : "opacity-60 hover:opacity-100 w-9 sm:w-11 h-9 sm:h-10 hover:scale-105 border-2 border-transparent"
                  }`}
                  title={m.name}
                >
                  <Image
                    src={m.thumbUrl}
                    alt={m.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-accent/15 z-10" />
                  )}
                  {/* Title Tooltip */}
                  <span className="absolute bottom-full mb-2 right-0 hidden group-hover/thumb:block whitespace-nowrap px-2.5 py-1 bg-surface border border-white/10 rounded-md text-[11px] font-semibold text-ink shadow-xl z-20">
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

