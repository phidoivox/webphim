"use client";

import { useState, useCallback, useSyncExternalStore, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { GalleryItem } from "@/types/movie";
import { PlayIcon } from "@/components/ui/icons";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface MovieGallerySectionProps {
  gallery: GalleryItem[];
  fallbackImages?: {
    thumbUrl?: string | null;
    posterUrl?: string | null;
    trailerUrl?: string | null;
  };
  movieName: string;
}

export default function MovieGallerySection({
  gallery,
  fallbackImages,
  movieName,
}: MovieGallerySectionProps) {
  const mounted = useIsMounted();
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // 1. Tách và chuẩn hóa danh sách Video
  const rawVideos = gallery ? gallery.filter((i) => i.mediaType === "video") : [];
  const videos: GalleryItem[] =
    rawVideos.length > 0
      ? rawVideos
      : fallbackImages?.trailerUrl
      ? [
          {
            id: 9991,
            mediaType: "video" as const,
            type: "trailer",
            url: fallbackImages.trailerUrl,
            thumbUrl: fallbackImages.thumbUrl || fallbackImages.posterUrl || undefined,
            caption: "OFFICIAL TRAILER",
            durationSeconds: 135,
          },
        ]
      : [];

  // 2. Tách và chuẩn hóa danh sách Hình ảnh (Stills / Backdrops / Posters)
  const rawImages = gallery ? gallery.filter((i) => i.mediaType === "image") : [];
  const images: GalleryItem[] =
    rawImages.length > 0
      ? rawImages
      : [
          ...(fallbackImages?.thumbUrl
            ? [
                {
                  id: 9992,
                  mediaType: "image" as const,
                  type: "backdrop",
                  url: fallbackImages.thumbUrl,
                  thumbUrl: fallbackImages.thumbUrl,
                  caption: `${movieName} - Phân cảnh`,
                },
              ]
            : []),
          ...(fallbackImages?.posterUrl
            ? [
                {
                  id: 9993,
                  mediaType: "image" as const,
                  type: "poster",
                  url: fallbackImages.posterUrl,
                  thumbUrl: fallbackImages.posterUrl,
                  caption: `${movieName} - Áp phích`,
                },
              ]
            : []),
        ];

  // Trích xuất link embed YouTube nếu có
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  // Keyboard navigation cho Gallery Lightbox Modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") setSelectedImageIndex(null);
      if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      }
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev - 1 + images.length) % images.length : null
        );
      }
    },
    [selectedImageIndex, images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Khóa cuộn trang khi mở Modal
  useEffect(() => {
    if (selectedImageIndex !== null || selectedVideo !== null) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [selectedImageIndex, selectedVideo]);

  const isEmpty = videos.length === 0 && images.length === 0;

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Chưa có hình ảnh hoặc video cho phim này.
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-1">
      {/* ═══════════════ 1. PHẦN VIDEOS ═══════════════ */}
      {videos.length > 0 && (
        <section className="space-y-3.5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Videos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video) => {
              const captionText =
                video.caption?.toUpperCase().includes("TRAILER")
                  ? video.caption.toUpperCase()
                  : video.type === "trailer"
                  ? "OFFICIAL TRAILER"
                  : video.caption || "TRAILER";

              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#14151c] border border-white/10 shadow-lg transition-all duration-200 hover:border-red-500/60"
                >
                  {/* Aspect 16:9 Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/80">
                    {/* Thumbnail Image */}
                    <Image
                      src={video.thumbUrl || video.url}
                      alt={video.caption || movieName}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 opacity-85 z-10" />

                    {/* Top Left Netflix/Official Red Brand Tag */}
                    <div className="absolute top-2.5 left-3 pointer-events-none z-20">
                      <span className="text-[11px] sm:text-xs font-black tracking-widest text-red-600 drop-shadow-md">
                        NETFLIX
                      </span>
                    </div>

                    {/* Center Circular Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-xs transition-transform duration-200 group-hover:scale-110 group-hover:bg-red-600 group-hover:border-red-500 shadow-xl">
                        <PlayIcon className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Left Title with Red Vertical Bar */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 pointer-events-none z-20">
                      <span className="h-3.5 w-1 rounded-xs bg-red-600 shrink-0" />
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white drop-shadow-md truncate">
                        {captionText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════ 2. PHẦN HÌNH ẢNH (2 CỘT NHƯ ẢNH MẪU) ═══════════════ */}
      {images.length > 0 && (
        <section className="space-y-3.5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Hình ảnh
          </h2>

          {/* Lưới 2 cột, click vào ảnh để mở Gallery Viewer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            {images.map((image, idx) => (
              <div
                key={image.id}
                onClick={() => setSelectedImageIndex(idx)}
                className="cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-[#14151c] border border-white/10 shadow-md transition-opacity hover:opacity-90"
              >
                <div className="relative aspect-[16/10] sm:aspect-video w-full overflow-hidden bg-black/60">
                  <Image
                    src={image.thumbUrl || image.url}
                    alt={image.caption || `${movieName} - Hình ảnh ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ 3. GALLERY IMAGE LIGHTBOX (PORTAL TRỰC TIẾP LÊN BODY) ═══════════════ */}
      {mounted &&
        selectedImageIndex !== null &&
        images[selectedImageIndex] &&
        createPortal(
          <div
            onClick={() => setSelectedImageIndex(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-fade-in"
          >
            {/* Nút đóng góc trên bên phải (Fixed Top Right with Safe Area) */}
            <button
              type="button"
              onClick={() => setSelectedImageIndex(null)}
              className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-[100000] flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/75 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Đóng"
            >
              <span className="text-lg sm:text-xl font-bold leading-none">✕</span>
            </button>

            {/* Nút lùi (Prev) bên trái */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    (selectedImageIndex - 1 + images.length) % images.length
                  );
                }}
                className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[100000] flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/40 sm:bg-transparent text-white/70 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-90"
                aria-label="Ảnh trước"
              >
                <span className="text-3xl sm:text-5xl font-light leading-none">‹</span>
              </button>
            )}

            {/* Ảnh trung tâm (Căn giữa hoàn hảo toàn màn hình) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] flex items-center justify-center px-2 sm:px-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImageIndex].url}
                alt={images[selectedImageIndex].caption || `${movieName} - Gallery`}
                className="max-h-[80vh] max-w-[90vw] sm:max-w-[85vw] object-contain rounded-md shadow-2xl"
              />
            </div>

            {/* Nút tiến (Next) bên phải */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((selectedImageIndex + 1) % images.length);
                }}
                className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[100000] flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/40 sm:bg-transparent text-white/70 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-90"
                aria-label="Ảnh tiếp"
              >
                <span className="text-3xl sm:text-5xl font-light leading-none">›</span>
              </button>
            )}

            {/* Chỉ số ảnh ở dưới cùng (e.g. 1 / 2) */}
            <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100000] px-4 py-1 rounded-full bg-black/80 border border-white/15 text-xs font-semibold text-gray-300 tracking-widest shadow-lg">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </div>,
          document.body
        )}

      {/* ═══════════════ 4. VIDEO PLAYER MODAL (PORTAL TRỰC TIẾP LÊN BODY) ═══════════════ */}
      {mounted &&
        selectedVideo &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-4xl rounded-2xl bg-[#16171f] border border-white/15 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#111218]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-1 bg-red-600 rounded-xs" />
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {selectedVideo.caption || `${movieName} - Video`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Video Content */}
              <div className="relative aspect-video w-full bg-black">
                {selectedVideo.url.includes("youtube") || selectedVideo.url.includes("youtu.be") ? (
                  <iframe
                    src={getEmbedUrl(selectedVideo.url)}
                    title={selectedVideo.caption || movieName}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedVideo.url}
                    controls
                    autoPlay
                    className="h-full w-full"
                    poster={selectedVideo.thumbUrl || undefined}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
