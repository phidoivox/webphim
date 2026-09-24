"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  createAdminMovieApi,
  getAdminTaxonomyCountriesApi,
  getAdminTaxonomyGenresApi,
  updateAdminMovieApi,
} from "@/lib/api";
import { parseEpisodesFromPhimApi } from "@/lib/phimapi";
import { movieFormSchema } from "@/schemas/movie";

import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  FlameIcon,
  GlobeIcon,
  ImageIcon,
  LayersIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  TvIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MovieFormHandle {
  fetchPhimApi: (customSlug?: string) => Promise<void>;
}

export interface MovieFormProps {
  initialData?: any;
  isEdit?: boolean;
}

type FormStudioTab = "basic" | "media" | "taxonomies" | "display";

/**
 * Hàm sinh slug chuẩn SEO từ tiếng Việt có dấu
 */
function generateVietnameseSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Trích xuất YouTube Video ID từ link
 */
function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export const SCHEDULE_DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "CN" },
] as const;

/**
 * Parse text ghi chú lịch (VD "Thứ 3, Thứ 6 lúc 20h") ra mảng ngày 0-6.
 * Mirror frontend của Movie::parseScheduleDays bên backend.
 */
export function parseScheduleDaysFromText(text: string | null | undefined): number[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const days: number[] = [];
  if (lower.includes("chủ nhật") || lower.includes("chu nhat")) days.push(0);
  if (/(^|[^a-z])cn([^a-z]|$)/.test(lower)) days.push(0);
  const dayMatches = lower.matchAll(/(?:thứ|thu)\s*(\d)/g);
  for (const m of dayMatches) {
    const n = Number(m[1]);
    if (n >= 2 && n <= 7) days.push(n === 7 ? 6 : n - 1);
  }
  if (lower.includes("thứ hai") || lower.includes("thu hai")) days.push(1);
  if (lower.includes("thứ ba") || lower.includes("thu ba")) days.push(2);
  if (lower.includes("thứ tư") || lower.includes("thứ bốn") || lower.includes("thu tu")) days.push(3);
  if (lower.includes("thứ năm") || lower.includes("thu nam")) days.push(4);
  if (lower.includes("thứ sáu") || lower.includes("thu sau")) days.push(5);
  if (lower.includes("thứ bảy") || lower.includes("thu bay")) days.push(6);
  return [...new Set(days)];
}

/**
 * Trích xuất slug phim từ chuỗi nhập hoặc URL PhimAPI
 */
function extractSlugFromInput(input: string): string {
  if (!input) return "";
  let cleanSlug = input.trim();
  if (cleanSlug.includes("/phim/")) {
    const parts = cleanSlug.split("/phim/");
    cleanSlug = parts[parts.length - 1];
  }
  return cleanSlug.replace(/[\?#].*$/, "").replace(/\/+$/, "").trim();
}

const MovieForm = forwardRef<MovieFormHandle, MovieFormProps>(function MovieForm(
  { initialData, isEdit = false },
  ref
) {
  const { token } = useAuth();
  const router = useRouter();

  // Active studio tab
  const [activeTab, setActiveTab] = useState<FormStudioTab>("basic");

  // Taxonomies from backend
  const [genresList, setGenresList] = useState<any[]>([]);
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);

  // Search filters for taxonomies
  const [genreSearch, setGenreSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  // Trailer tester state
  const [showTrailerPlayer, setShowTrailerPlayer] = useState(false);

  // Form submission states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PhimAPI Auto-Fetch state
  const [fetchingPhimApi, setFetchingPhimApi] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    origin_name: initialData?.originName || initialData?.origin_name || "",
    slug: initialData?.slug || (initialData?.name ? generateVietnameseSlug(initialData.name) : ""),
    content: initialData?.content || "",
    type: initialData?.type || "single",
    status: initialData?.status || "completed",
    quality: initialData?.quality || "HD",
    lang: initialData?.lang || "Vietsub",
    thumb_url: initialData?.thumbUrl || initialData?.thumb_url || "",
    poster_url: initialData?.posterUrl || initialData?.poster_url || "",
    trailer_url: initialData?.trailerUrl || initialData?.trailer_url || "",
    duration: initialData?.duration || "",
    episode_current: initialData?.episodeCurrent || initialData?.episode_current || "1",
    episode_total: initialData?.episodeTotal || initialData?.episode_total || "1",
    notify_schedule: initialData?.notifySchedule || initialData?.notify_schedule || "",
    schedule_days: initialData?.scheduleDays || initialData?.schedule_days || [],
    year: initialData?.year || new Date().getFullYear(),
    is_active: initialData?.isActive !== undefined ? initialData.isActive : true,
    is_featured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
    is_cinema: initialData?.isCinema !== undefined ? initialData.isCinema : false,
    imdb_rating: initialData?.imdbRating !== undefined && initialData?.imdbRating !== null ? String(initialData.imdbRating) : (initialData?.imdb_rating ? String(initialData.imdb_rating) : ""),
    tmdb_rating: initialData?.tmdbRating !== undefined && initialData?.tmdbRating !== null ? String(initialData.tmdbRating) : (initialData?.tmdb_rating ? String(initialData.tmdb_rating) : ""),
    tmdb_id: initialData?.tmdbId || initialData?.tmdb_id || "",
    imdb_id: initialData?.imdbId || initialData?.imdb_id || "",
    source_url: initialData?.sourceUrl || initialData?.source_url || "",
    genre_ids: initialData?.genres?.map((g: any) => g.id) || [],
    country_ids: initialData?.countries?.map((c: any) => c.id) || [],
    tags: (initialData?.tags || []).map((t: any) => (typeof t === "string" ? t : (t.name || ""))),
    actors: (initialData?.actors || []).map((a: any) => ({
      id: a.id,
      name: typeof a === "string" ? a : (a.name || ""),
      character_name: a.characterName || a.character_name || "",
    })),
    directors: (initialData?.directors || []).map((d: any) => ({
      id: d.id,
      name: typeof d === "string" ? d : (d.name || ""),
    })),
    galleries: (initialData?.galleries || []).map((g: any, idx: number) => ({
      id: g.id,
      media_type: g.mediaType || g.media_type || "image",
      type: g.type || "still",
      url: g.url || "",
      thumb_url: g.thumbUrl || g.thumb_url || "",
      caption: g.caption || "",
      sort_order: g.sortOrder !== undefined ? g.sortOrder : idx + 1,
    })),
    episodes: (initialData?.episodes || []) as any[],
  });

  // Actor, Director & Tag Quick Input States
  const [newActorName, setNewActorName] = useState("");
  const [newActorCharacter, setNewActorCharacter] = useState("");
  const [newDirectorName, setNewDirectorName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const handleAddTag = (customTag?: string) => {
    const raw = (typeof customTag === "string" ? customTag : newTagName).trim();
    if (!raw) return;
    if (raw.includes(",")) {
      const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
      setFormData((prev: any) => ({
        ...prev,
        tags: Array.from(new Set([...(prev.tags || []), ...parts])),
      }));
    } else {
      if (!(formData.tags || []).some((t: string) => t.toLowerCase() === raw.toLowerCase())) {
        setFormData((prev: any) => ({
          ...prev,
          tags: [...(prev.tags || []), raw],
        }));
      }
    }
    if (typeof customTag !== "string") {
      setNewTagName("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      tags: (prev.tags || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleClearAllTags = () => {
    setFormData((prev: any) => ({ ...prev, tags: [] }));
  };

  const handleAddActor = () => {
    const raw = newActorName.trim();
    if (!raw) return;
    if (raw.includes(",")) {
      const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
      setFormData((prev: any) => ({
        ...prev,
        actors: [
          ...prev.actors,
          ...names
            .filter((n) => !prev.actors.some((a: any) => a.name.toLowerCase() === n.toLowerCase()))
            .map((n) => ({ name: n, character_name: "" })),
        ],
      }));
    } else {
      if (formData.actors.some((a: any) => a.name.toLowerCase() === raw.toLowerCase())) {
        return;
      }
      setFormData((prev: any) => ({
        ...prev,
        actors: [
          ...prev.actors,
          { name: raw, character_name: newActorCharacter.trim() || "" },
        ],
      }));
    }
    setNewActorName("");
    setNewActorCharacter("");
  };

  const handleRemoveActor = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      actors: prev.actors.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleClearAllActors = () => {
    setFormData((prev: any) => ({ ...prev, actors: [] }));
  };

  const handleAddDirector = () => {
    const raw = newDirectorName.trim();
    if (!raw) return;
    if (raw.includes(",")) {
      const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
      setFormData((prev: any) => ({
        ...prev,
        directors: [
          ...prev.directors,
          ...names
            .filter((n) => !prev.directors.some((d: any) => d.name.toLowerCase() === n.toLowerCase()))
            .map((n) => ({ name: n })),
        ],
      }));
    } else {
      if (formData.directors.some((d: any) => d.name.toLowerCase() === raw.toLowerCase())) {
        return;
      }
      setFormData((prev: any) => ({
        ...prev,
        directors: [...prev.directors, { name: raw }],
      }));
    }
    setNewDirectorName("");
  };

  const handleRemoveDirector = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      directors: prev.directors.filter((_: any, i: number) => i !== index),
    }));
  };

  useEffect(() => {
    async function loadTaxonomies() {
      try {
        setLoadingTaxonomies(true);
        const [genres, countries] = await Promise.all([
          getAdminTaxonomyGenresApi(token),
          getAdminTaxonomyCountriesApi(token),
        ]);
        setGenresList(genres);
        setCountriesList(countries);
      } catch (e) {
        console.error("Lỗi tải thể loại/quốc gia", e);
      } finally {
        setLoadingTaxonomies(false);
      }
    }
    loadTaxonomies();
  }, [token]);

  // PhimAPI Auto-Fetch Handler (Lấy thông tin + kho hình ảnh cùng 1 lúc)
  const handleFetchPhimApi = async (customSlug?: string) => {
    const rawInput = typeof customSlug === "string" ? customSlug : (formData.slug || formData.name);
    const cleanSlug = extractSlugFromInput(rawInput);
    if (!cleanSlug) {
      setError("Vui lòng nhập Tên phim hoặc Slug trước khi bấm lấy dữ liệu tự động.");
      setActiveTab("basic");
      return;
    }

    try {
      setFetchingPhimApi(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`https://phimapi.com/v1/api/phim/${encodeURIComponent(cleanSlug)}`);
      if (!res.ok) {
        throw new Error(`Không tìm thấy phim với slug "${cleanSlug}" trên PhimAPI (HTTP ${res.status}).`);
      }

      const json = await res.json();
      if (json.status !== "success" || !json.data?.item) {
        throw new Error(json.message || "Không tìm thấy dữ liệu bộ phim trên PhimAPI.");
      }

      const item = json.data.item;

      // Khớp thể loại (genres)
      const matchedGenreIds: number[] = [];
      if (Array.isArray(item.category)) {
        for (const cat of item.category) {
          const found = genresList.find(
            (g) => g.slug === cat.slug || g.name.toLowerCase() === cat.name.toLowerCase()
          );
          if (found && !matchedGenreIds.includes(found.id)) {
            matchedGenreIds.push(found.id);
          }
        }
      }

      // Khớp quốc gia (countries)
      const matchedCountryIds: number[] = [];
      if (Array.isArray(item.country)) {
        for (const c of item.country) {
          const found = countriesList.find(
            (ctry) => ctry.slug === c.slug || ctry.name.toLowerCase() === c.name.toLowerCase()
          );
          if (found && !matchedCountryIds.includes(found.id)) {
            matchedCountryIds.push(found.id);
          }
        }
      }

      // Phân loại định dạng phim
      let movieType = "single";
      if (item.type === "series" || item.type === "hoathinh" || item.type === "tvshows") {
        if (item.type === "tvshows") {
          movieType = "tv-show";
        } else if (item.episode_total === 1 || item.episode_current === "Full") {
          movieType = "single";
        } else {
          movieType = "series";
        }
      }

      // Chuẩn hóa chất lượng phim
      let movieQuality = "HD";
      const qUpper = (item.quality || "").toUpperCase();
      if (qUpper.includes("4K")) movieQuality = "4K";
      else if (qUpper.includes("FHD") || qUpper.includes("1080")) movieQuality = "FHD";
      else if (qUpper.includes("CAM")) movieQuality = "CAM";
      else movieQuality = "HD";

      // Làm sạch nội dung HTML
      const cleanContent = item.content ? item.content.replace(/<[^>]*>?/gm, "").trim() : "";

      // Nạp ảnh gallery từ API images chuyên biệt (TMDb / PhimAPI)
      let newGalleriesFromApi: any[] = [];
      let bestPosterFromImages: string | null = null;
      let bestBackdropFromImages: string | null = null;

      try {
        const imgRes = await fetch(`https://phimapi.com/v1/api/phim/${cleanSlug}/images`);
        if (imgRes.ok) {
          const imgJson = await imgRes.json();
          if (imgJson.data?.images && Array.isArray(imgJson.data.images)) {
            const backdropBase = imgJson.data?.image_sizes?.backdrop?.original || "https://image.tmdb.org/t/p/original";
            const backdropThumbBase = imgJson.data?.image_sizes?.backdrop?.w300 || "https://image.tmdb.org/t/p/w300";
            const posterBase = imgJson.data?.image_sizes?.poster?.original || "https://image.tmdb.org/t/p/original";
            const posterThumbBase = imgJson.data?.image_sizes?.poster?.w342 || "https://image.tmdb.org/t/p/w342";

            newGalleriesFromApi = imgJson.data.images.map((img: any, idx: number) => {
              const isPoster = img.type === "poster";
              const fullUrl = `${isPoster ? posterBase : backdropBase}${img.file_path}`;
              const thumbUrl = `${isPoster ? posterThumbBase : backdropThumbBase}${img.file_path}`;
              return {
                media_type: "image",
                type: isPoster ? "poster" : "backdrop",
                url: fullUrl,
                thumb_url: thumbUrl,
                caption: `${isPoster ? "Poster" : "Backdrop"} (${img.width}x${img.height})`,
                sort_order: idx + 1,
              };
            });

            const firstP = newGalleriesFromApi.find((g) => g.type === "poster");
            const firstB = newGalleriesFromApi.find((g) => g.type === "backdrop");
            if (firstP) bestPosterFromImages = firstP.url;
            if (firstB) bestBackdropFromImages = firstB.url;
          }
        }
      } catch (imgErr) {
        console.warn("Không thể lấy thêm ảnh từ /images endpoint", imgErr);
      }

      // Fallback nạp og_image nếu /images rỗng
      if (newGalleriesFromApi.length === 0) {
        const ogImages = json.data?.seoOnPage?.og_image || [];
        if (Array.isArray(ogImages)) {
          newGalleriesFromApi = ogImages.map((imgUrl: string, idx: number) => ({
            media_type: "image",
            type: "backdrop",
            url: imgUrl,
            thumb_url: imgUrl,
            caption: `Hình ảnh ${idx + 1} - ${item.name}`,
            sort_order: idx + 1,
          }));
        }
      }

      // Nạp danh sách Diễn viên & Đạo diễn từ PhimAPI
      const apiActors: any[] = [];
      if (Array.isArray(item.actor)) {
        for (const act of item.actor) {
          if (
            typeof act === "string" &&
            act.trim() &&
            act.trim().toLowerCase() !== "đang cập nhật" &&
            act.trim().toLowerCase() !== "n/a"
          ) {
            apiActors.push({ name: act.trim(), character_name: "" });
          }
        }
      }

      const apiDirectors: any[] = [];
      if (Array.isArray(item.director)) {
        for (const dir of item.director) {
          if (
            typeof dir === "string" &&
            dir.trim() &&
            dir.trim().toLowerCase() !== "đang cập nhật" &&
            dir.trim().toLowerCase() !== "n/a"
          ) {
            apiDirectors.push({ name: dir.trim() });
          }
        }
      }

      // Nạp danh sách Thẻ từ khóa (Tags / Keywords) từ API & SEO
      const apiTags: string[] = [];

      if (Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (typeof kw === "string" && kw.trim() && !apiTags.includes(kw.trim())) {
            apiTags.push(kw.trim());
          }
        }
      } else if (typeof item.keywords === "string" && item.keywords.trim()) {
        const parts = item.keywords.split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const p of parts) {
          if (!apiTags.includes(p)) apiTags.push(p);
        }
      }

      if (Array.isArray(item.tags)) {
        for (const t of item.tags) {
          const tName = typeof t === "string" ? t.trim() : (t?.name ? String(t.name).trim() : "");
          if (tName && !apiTags.includes(tName)) {
            apiTags.push(tName);
          }
        }
      }

      const seoKeywords = json.data?.seoOnPage?.metaKeywords || json.data?.seoOnPage?.keywords;
      if (typeof seoKeywords === "string" && seoKeywords.trim()) {
        const parts = seoKeywords.split(",").map((s: string) => s.trim()).filter(Boolean);
        for (const p of parts) {
          if (!apiTags.some((t) => t.toLowerCase() === p.toLowerCase())) {
            apiTags.push(p);
          }
        }
      } else if (Array.isArray(seoKeywords)) {
        for (const p of seoKeywords) {
          if (typeof p === "string" && p.trim() && !apiTags.some((t) => t.toLowerCase() === p.trim().toLowerCase())) {
            apiTags.push(p.trim());
          }
        }
      }

      // Smart tags nếu tags còn ít
      if (apiTags.length === 0) {
        if (item.origin_name && item.origin_name !== item.name) {
          apiTags.push(item.origin_name.trim());
        }
        if (Array.isArray(item.category)) {
          for (const cat of item.category) {
            if (cat.name && !apiTags.includes(cat.name)) {
              apiTags.push(cat.name);
            }
          }
        }
        if (item.type === "hoathinh" && !apiTags.includes("Anime")) {
          apiTags.push("Anime");
        }
        if (item.chieurap && !apiTags.includes("Phim Chiếu Rạp")) {
          apiTags.push("Phim Chiếu Rạp");
        }
      }

      // Nạp danh sách tập phim & server phát từ PhimAPI
      const apiEpisodes = parseEpisodesFromPhimApi(item.episodes);

      setFormData((prev: any) => ({
        ...prev,
        name: item.name || prev.name,
        origin_name: item.origin_name || prev.origin_name,
        slug: item.slug || prev.slug,
        content: cleanContent || prev.content,
        type: movieType,
        status: item.status === "ongoing" ? "ongoing" : item.status === "trailer" ? "trailer" : "completed",
        quality: movieQuality,
        lang: item.lang || prev.lang,
        year: item.year ? Number(item.year) : prev.year,
        duration: item.time || prev.duration,
        episode_current: item.episode_current || (apiEpisodes.length > 0 ? (movieType === "single" ? "Full" : `Tập ${apiEpisodes.length}`) : (movieType === "single" ? "Full" : "Tập 1")),
        episode_total: item.episode_total ? String(item.episode_total) : (apiEpisodes.length > 0 ? `${apiEpisodes.length} tập` : (movieType === "single" ? "1" : "16")),
        is_cinema: Boolean(item.chieurap),
        thumb_url: item.thumb_url || bestBackdropFromImages || prev.thumb_url,
        poster_url: item.poster_url || bestPosterFromImages || prev.poster_url,
        trailer_url: item.trailer_url || prev.trailer_url,
        imdb_rating: item.imdb?.vote_average ? String(item.imdb.vote_average) : prev.imdb_rating,
        tmdb_rating: item.tmdb?.vote_average ? String(item.tmdb.vote_average) : prev.tmdb_rating,
        tmdb_id: item.tmdb?.id ? String(item.tmdb.id) : prev.tmdb_id,
        imdb_id: item.imdb?.id ? String(item.imdb.id) : prev.imdb_id,
        source_url: `https://phimapi.com/v1/api/phim/${cleanSlug}`,
        genre_ids: matchedGenreIds.length > 0 ? matchedGenreIds : prev.genre_ids,
        country_ids: matchedCountryIds.length > 0 ? matchedCountryIds : prev.country_ids,
        tags: apiTags.length > 0 ? apiTags : prev.tags,
        actors: apiActors.length > 0 ? apiActors : prev.actors,
        directors: apiDirectors.length > 0 ? apiDirectors : prev.directors,
        galleries: newGalleriesFromApi.length > 0 ? newGalleriesFromApi : prev.galleries,
        episodes: apiEpisodes.length > 0 ? apiEpisodes : prev.episodes,
      }));

      setSuccessMessage(
        `⚡ Đã tự động lấy đầy đủ thông tin, ${apiEpisodes.length > 0 ? `${apiEpisodes.length} tập (${item.episodes?.length || 0} server), ` : ""}${matchedGenreIds.length} thể loại, ${matchedCountryIds.length} quốc gia, ${apiTags.length} từ khóa/tags, ${apiActors.length} diễn viên & ${newGalleriesFromApi.length} ảnh cho phim "${item.name}"!`
      );
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra khi lấy thông tin từ PhimAPI.");
    } finally {
      setFetchingPhimApi(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchPhimApi: handleFetchPhimApi,
  }));

  // Gallery Management States & Handlers
  const [showBulkAddGallery, setShowBulkAddGallery] = useState(false);
  const [bulkGalleryText, setBulkGalleryText] = useState("");

  const handleAddGalleryItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      galleries: [
        ...prev.galleries,
        {
          media_type: "image",
          type: "still",
          url: "",
          thumb_url: "",
          caption: "",
          sort_order: prev.galleries.length + 1,
        },
      ],
    }));
  };

  const handleRemoveGalleryItem = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      galleries: prev.galleries.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleGalleryChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      galleries: prev.galleries.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleBulkAddGallery = () => {
    if (!bulkGalleryText.trim()) return;
    const urls = bulkGalleryText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http://") || l.startsWith("https://") || l.startsWith("/"));

    if (urls.length === 0) return;

    const newItems = urls.map((url, idx) => ({
      media_type: url.includes(".mp4") || url.includes("youtube.com") || url.includes("youtu.be") ? "video" : "image",
      type: "still",
      url,
      thumb_url: url,
      caption: "",
      sort_order: formData.galleries.length + idx + 1,
    }));

    setFormData((prev: any) => ({
      ...prev,
      galleries: [...prev.galleries, ...newItems],
    }));

    setBulkGalleryText("");
    setShowBulkAddGallery(false);
  };

  const handleSetAsPoster = (url: string) => {
    setFormData((prev: any) => ({ ...prev, poster_url: url }));
    setSuccessMessage("Đã đặt làm Poster chính thành công!");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleSetAsThumb = (url: string) => {
    setFormData((prev: any) => ({ ...prev, thumb_url: url }));
    setSuccessMessage("Đã đặt làm Backdrop chính thành công!");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Name change handler with automatic slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: generateVietnameseSlug(newName),
    }));
  };

  const isSeries = formData.type === "series" || formData.type === "tv-show";

  const handleQuickDuration = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      duration: isSeries ? `${minutes} phút/tập` : `${minutes} phút`,
    }));
  };

  const handleQuickEpisodeTotal = (total: string | number) => {
    setFormData((prev) => ({
      ...prev,
      episode_total: typeof total === "number" ? `${total} tập` : String(total),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "type") {
      const isNewSeries = value === "series" || value === "tv-show";
      setFormData((prev) => ({
        ...prev,
        type: value,
        episode_current: isNewSeries
          ? (prev.episode_current === "Full" ? "Tập 1" : prev.episode_current)
          : "Full",
        episode_total: isNewSeries
          ? (prev.episode_total === "1" ? "16 tập" : prev.episode_total)
          : "1",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleGenre = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(id)
        ? prev.genre_ids.filter((gId: number) => gId !== id)
        : [...prev.genre_ids, id],
    }));
  };

  const toggleCountry = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      country_ids: prev.country_ids.includes(id)
        ? prev.country_ids.filter((cId: number) => cId !== id)
        : [...prev.country_ids, id],
    }));
  };

  const selectAllGenres = () => {
    setFormData((prev) => ({
      ...prev,
      genre_ids: genresList.map((g) => g.id),
    }));
  };

  const clearAllGenres = () => {
    setFormData((prev) => ({
      ...prev,
      genre_ids: [],
    }));
  };

  const selectAllCountries = () => {
    setFormData((prev) => ({
      ...prev,
      country_ids: countriesList.map((c) => c.id),
    }));
  };

  const clearAllCountries = () => {
    setFormData((prev) => ({
      ...prev,
      country_ids: [],
    }));
  };

  // Filtered Taxonomies for Quick Search
  const filteredGenres = useMemo(() => {
    if (!genreSearch.trim()) return genresList;
    return genresList.filter((g) =>
      g.name.toLowerCase().includes(genreSearch.trim().toLowerCase())
    );
  }, [genresList, genreSearch]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countriesList;
    return countriesList.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.trim().toLowerCase())
    );
  }, [countriesList, countrySearch]);

  const youtubeVideoId = useMemo(() => {
    return extractYoutubeId(formData.trailer_url);
  }, [formData.trailer_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = movieFormSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || validation.error.message || "Vui lòng kiểm tra lại các trường thông tin.";
      setError(firstError);
      setActiveTab("basic");
      return;
    }


    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      let formattedDuration = formData.duration?.trim() || "";
      if (formattedDuration && /^\d+$/.test(formattedDuration)) {
        formattedDuration = isSeries ? `${formattedDuration} phút/tập` : `${formattedDuration} phút`;
      }

      const payload = {
        ...formData,
        notify_schedule: formData.notify_schedule?.trim() || null,
        schedule_days: formData.schedule_days.length > 0 ? formData.schedule_days : null,
        slug: formData.slug || generateVietnameseSlug(formData.name),
        duration: formattedDuration || (isSeries ? "45 phút/tập" : "120 phút"),
        episode_current: isSeries
          ? (formData.episode_current || (initialData?.episodes?.length ? `Tập ${initialData.episodes.length}` : "Tập 1"))
          : "Full",
        episode_total: isSeries
          ? (formData.episode_total || "Đang cập nhật")
          : "1",
        imdb_rating: formData.imdb_rating ? Number(formData.imdb_rating) : null,
        tmdb_rating: formData.tmdb_rating ? Number(formData.tmdb_rating) : null,
        tmdb_id: formData.tmdb_id || null,
        imdb_id: formData.imdb_id || null,
        source_url: formData.source_url || null,
        tags: (formData.tags || []).filter(Boolean),
        actors: (formData.actors || [])
          .filter((a: any) => Boolean(a && (typeof a === "string" ? a.trim() : a.name?.trim())))
          .map((a: any, idx: number) => ({
            id: typeof a === "object" ? a.id || null : null,
            name: typeof a === "string" ? a.trim() : (a.name?.trim() || ""),
            character_name: typeof a === "object" ? a.character_name?.trim() || null : null,
            sort_order: idx + 1,
          })),
        directors: (formData.directors || [])
          .filter((d: any) => Boolean(d && (typeof d === "string" ? d.trim() : d.name?.trim())))
          .map((d: any, idx: number) => ({
            id: typeof d === "object" ? d.id || null : null,
            name: typeof d === "string" ? d.trim() : (d.name?.trim() || ""),
            sort_order: idx + 1,
          })),
        galleries: formData.galleries
          .filter((g: any) => g.url && g.url.trim() !== "")
          .map((g: any, idx: number) => ({
            media_type: g.media_type || "image",
            type: g.type || "still",
            url: g.url.trim(),
            thumb_url: g.thumb_url?.trim() || null,
            caption: g.caption?.trim() || null,
            sort_order: idx + 1,
          })),
        episodes: formData.episodes?.length
          ? formData.episodes.map((ep: any, idx: number) => ({
              name: ep.name,
              slug: ep.slug,
              sort_order: ep.sort_order ?? ep.sortOrder ?? idx + 1,
              servers: Array.isArray(ep.servers)
                ? ep.servers
                    .filter((s: any) => ((s.server_name ?? s.serverName ?? "") as string).trim() !== "")
                    .map((s: any, sIdx: number) => ({
                      server_name: ((s.server_name ?? s.serverName) as string).trim(),
                      lang_type: s.lang_type ?? s.langType ?? "vietsub",
                      link_m3u8: s.link_m3u8 ?? s.linkM3u8 ?? null,
                      link_embed: s.link_embed ?? s.linkEmbed ?? null,
                      sort_order: s.sort_order ?? s.sortOrder ?? sIdx + 1,
                      is_active: s.is_active ?? s.isActive ?? true,
                    }))
                : [],
            }))
          : undefined,
      };

      if (isEdit) {
        await updateAdminMovieApi(initialData.id, payload, token);
        setSuccessMessage("Cập nhật thông tin phim thành công!");
        setTimeout(() => {
          router.push("/admin/movies");
        }, 1200);
      } else {
        const res = await createAdminMovieApi(payload, token);
        setSuccessMessage("Tạo phim mới thành công! Chuyển tới trang quản lý tập...");
        setTimeout(() => {
          router.push(`/admin/movies/${res.data.id}?tab=episodes`);
        }, 1200);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.errors) {
        const msgs = Object.values(err.errors).flat();
        setError(msgs[0] || err.message || "Có lỗi xảy ra khi lưu thông tin phim.");
      } else {
        setError(err?.message || "Có lỗi xảy ra khi lưu thông tin phim.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── ALERTS & NOTIFICATIONS ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400 animate-fade-in">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 animate-fade-in">
          <CheckCircle2Icon className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── TABBED STUDIO NAVIGATION ── */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Tab 1: Basic Info */}
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "basic"
                ? "bg-white/10 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <FilmIcon className="h-3.5 w-3.5" />
            <span>1. Thông Tin Cơ Bản</span>
          </button>

          {/* Tab 2: Media & Trailer */}
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "media"
                ? "bg-white/10 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <VideoIcon className="h-3.5 w-3.5" />
            <span>2. Media & Trailer</span>
            {(formData.poster_url || formData.thumb_url) && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Tab 3: Taxonomies & Cast */}
          <button
            type="button"
            onClick={() => setActiveTab("taxonomies")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "taxonomies"
                ? "bg-white/10 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" />
            <span>3. Thể Loại, Quốc Gia & Diễn Viên</span>
            {(formData.genre_ids.length > 0 || (formData.actors && formData.actors.length > 0)) && (
              <span className="rounded bg-white/10 px-1 py-0.2 text-[10px] font-mono text-slate-300">
                {formData.genre_ids.length + (formData.actors?.length || 0)}
              </span>
            )}
          </button>

          {/* Tab 4: Display Options */}
          <button
            type="button"
            onClick={() => setActiveTab("display")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              activeTab === "display"
                ? "bg-white/10 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <ActivityIcon className="h-3.5 w-3.5" />
            <span>4. Tùy Chọn Hiển Thị</span>
            {formData.is_featured && (
              <FlameIcon className="h-3 w-3 text-amber-400" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {formData.episodes && formData.episodes.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2Icon className="h-3.5 w-3.5" />
              <span>Đã nạp sẵn {formData.episodes.length} tập</span>
            </div>
          )}

          {!isEdit && (
            <div className="flex items-center gap-2">
              {formData.slug && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span>Slug:</span>
                  <code className="text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {formData.slug}
                  </code>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleFetchPhimApi()}
                disabled={fetchingPhimApi || (!formData.name.trim() && !formData.slug.trim())}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Tự động lấy toàn bộ thông tin & ảnh từ PhimAPI"
              >
                {fetchingPhimApi ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang lấy...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-3 w-3 text-slate-400" />
                    <span>Lấy từ PhimAPI</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB 1: THÔNG TIN CƠ BẢN ── */}
      {activeTab === "basic" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FilmIcon className="h-4 w-4" />
              <span>Thông Tin Tác Phẩm</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Nhập các trường nhận diện chính của phim. Tên tiếng Việt và Định dạng là bắt buộc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên phim */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Tên phim (Tiếng Việt) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleNameChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchPhimApi();
                  }
                }}
                placeholder="VD: Đào, Phở và Piano hoặc thanh-guom-diet-quy-vo-han-thanh"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none transition"
              />
            </div>

            {/* Tên gốc / Quốc tế */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Tên gốc / Tên tiếng Anh
              </label>
              <input
                type="text"
                name="origin_name"
                value={formData.origin_name}
                onChange={handleChange}
                placeholder="VD: Peach, Pho and Piano"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none transition"
              />
            </div>

            {/* Định dạng, Trạng thái, Chất lượng, Ngôn ngữ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Định dạng phim
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="single">Phim Lẻ</option>
                  <option value="series">Phim Bộ</option>
                  <option value="tv-show">TV Show</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="completed">Hoàn thành</option>
                  <option value="ongoing">Đang chiếu</option>
                  <option value="trailer">Sắp chiếu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Chất lượng
                </label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="HD">HD (720p)</option>
                  <option value="FHD">Full HD (1080p)</option>
                  <option value="4K">4K Ultra HD</option>
                  <option value="CAM">Bản CAM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Ngôn ngữ
                </label>
                <select
                  name="lang"
                  value={formData.lang}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="Vietsub">Vietsub</option>
                  <option value="Thuyết minh">Thuyết minh</option>
                  <option value="Lồng tiếng">Lồng tiếng</option>
                  <option value="Engsub">Engsub</option>
                  <option value="Đa ngôn ngữ">Đa ngôn ngữ</option>
                  <option value="Raw">Raw</option>
                </select>
              </div>
            </div>

            {/* Năm & Thời lượng & Số tập (Tự động thích ứng theo Định dạng phim) */}
            <div className="md:col-span-2 rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Thông số phát sóng & thời lượng</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    ({isSeries ? "Chế độ Phim Bộ / TV Show" : "Chế độ Phim Lẻ 1 Tập"})
                  </span>
                </span>
                {!isSeries && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 w-fit">
                    Tự động thiết lập: 1 tập (Full)
                  </span>
                )}
              </div>

              <div className={`grid gap-3.5 ${isSeries ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                {/* 1. Năm phát hành */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Năm phát hành
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="1900"
                    max="2099"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:border-accent focus:outline-none"
                  />
                </div>

                {/* 2. Thời lượng */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isSeries ? "Thời lượng mỗi tập" : "Thời lượng toàn bộ phim"}
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder={isSeries ? "VD: 45 phút/tập" : "VD: 120 phút"}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                  />
                  {/* Quick duration chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">Gợi ý:</span>
                    {(isSeries ? [30, 45, 60] : [90, 100, 120, 150]).map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleQuickDuration(mins)}
                        className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition cursor-pointer"
                      >
                        {mins}p
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Tổng số tập (Chỉ hiện khi là Phim Bộ) */}
                {isSeries && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tổng số tập dự kiến
                    </label>
                    <input
                      type="text"
                      name="episode_total"
                      value={formData.episode_total}
                      onChange={handleChange}
                      placeholder="VD: 16 (tập) hoặc để trống"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                    />
                    {/* Quick episode total chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-500">Gợi ý:</span>
                      {[12, 16, 24, "Đang cập nhật"].map((tot) => (
                        <button
                          key={String(tot)}
                          type="button"
                          onClick={() => handleQuickEpisodeTotal(tot)}
                          className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition cursor-pointer"
                        >
                          {typeof tot === "number" ? `${tot} tập` : tot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isSeries && (
                <p className="text-[11px] text-slate-400 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  💡 <strong>Tập hiện tại:</strong> Hệ thống sẽ tự động cập nhật theo số lượng tập thực tế bạn thêm trong tab <em>&quot;2. Tập Phim &amp; Nguồn Video&quot;</em>.
                </p>
              )}

              {/* 4. Lịch chiếu tuần — chỉ áp dụng phim bộ/TV đang chiếu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ngày chiếu trong tuần
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SCHEDULE_DAY_OPTIONS.map((opt) => {
                      const checked = (formData.schedule_days || []).includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            checked
                              ? "border-accent bg-accent/10 text-accent font-semibold"
                              : "border-white/10 bg-[#141722] text-white/60 hover:border-white/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => {
                              setFormData((prev) => {
                                const current = prev.schedule_days || [];
                                const next = checked
                                  ? current.filter((d: number) => d !== opt.value)
                                  : [...current, opt.value];
                                return { ...prev, schedule_days: next };
                              });
                            }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ghi chú lịch chiếu
                  </label>
                  <input
                    type="text"
                    name="notify_schedule"
                    value={formData.notify_schedule}
                    onChange={handleChange}
                    onBlur={(e) => {
                      // Chưa chọn ngày nào + text parse được -> tự điền checkboxes
                      if ((formData.schedule_days || []).length > 0) return;
                      const parsed = parseScheduleDaysFromText(e.target.value);
                      if (parsed.length > 0) {
                        setFormData((prev) => ({ ...prev, schedule_days: parsed }));
                      }
                    }}
                    placeholder='VD: "Thứ 3, Thứ 6 lúc 20h" (tự nhận ngày nếu chưa chọn)'
                    maxLength={255}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              {!isSeries && ((formData.schedule_days || []).length > 0 || formData.notify_schedule) && (
                <p className="text-[11px] text-amber-400/90 bg-amber-500/[0.06] p-2 rounded-lg border border-amber-500/20">
                  ⚠️ Lịch chiếu chỉ hiển thị với phim Bộ / TV Show đang chiếu. Phim lẻ không lên trang lịch chiếu.
                </p>
              )}
            </div>

            {/* Đánh Giá Quốc Tế: IMDb & TMDb */}
            <div className="md:col-span-2 rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>Điểm Đánh Giá Quốc Tế (IMDb & TMDb)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Thang điểm từ 0.0 đến 10.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Điểm IMDb */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center rounded bg-[#f5c518] px-1.5 py-0.5 text-[10px] font-black text-black leading-none">
                        IMDb
                      </span>
                      <span>Điểm IMDb</span>
                    </label>
                    {formData.imdb_rating && (
                      <span className="text-xs font-bold text-amber-400 tabular-nums">
                        ⭐ {Number(formData.imdb_rating).toFixed(1)} / 10
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="imdb_rating"
                    value={formData.imdb_rating}
                    onChange={handleChange}
                    placeholder="VD: 8.5"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:border-accent focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Gợi ý:</span>
                    {[7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, imdb_rating: String(score) }))}
                        className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition cursor-pointer"
                      >
                        {score.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Điểm TMDb */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center rounded bg-[#01b4e4] px-1.5 py-0.5 text-[10px] font-black text-white leading-none">
                        TMDb
                      </span>
                      <span>Điểm TMDb</span>
                    </label>
                    {formData.tmdb_rating && (
                      <span className="text-xs font-bold text-sky-400 tabular-nums">
                        {Number(formData.tmdb_rating).toFixed(1)} / 10
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="tmdb_rating"
                    value={formData.tmdb_rating}
                    onChange={handleChange}
                    placeholder="VD: 8.2"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:border-accent focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Gợi ý:</span>
                    {[7.0, 7.5, 8.0, 8.5, 9.0].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, tmdb_rating: String(score) }))}
                        className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition cursor-pointer"
                      >
                        {score.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung tóm tắt */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80">
                  Nội dung tóm tắt & Giới thiệu phim
                </label>
                <span className="text-[11px] text-white/40 font-mono">
                  {formData.content?.length || 0} ký tự
                </span>
              </div>
              <textarea
                name="content"
                rows={5}
                value={formData.content}
                onChange={handleChange}
                placeholder="Nhập phần tóm tắt ngắn gọn cốt truyện, bối cảnh phim..."
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MEDIA & TRAILER ── */}
      {activeTab === "media" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <VideoIcon className="h-4 w-4" />
              <span>Hình Ảnh Poster & Trailer Trực Tuyến</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cung cấp URL hình ảnh chuẩn tỉ lệ hiển thị cho trang chủ, banner chiếu phim và trailer.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Poster dọc 2:3 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  Poster Dọc (Tỉ lệ chuẩn 2:3)
                </label>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Tối ưu: 600x900px
                </span>
              </div>

              <input
                type="text"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
                placeholder="https://image.tmdb.org/t/p/w500/...jpg"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none font-mono"
              />

              <div className="flex items-center justify-center p-3 rounded-lg border border-white/5 bg-black/30">
                {formData.poster_url ? (
                  <div className="relative h-60 w-40 rounded-lg overflow-hidden border border-white/20 bg-black/60 shadow-lg group">
                    <img
                      src={formData.poster_url}
                      alt="Poster Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {formData.name || "Preview"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 w-32 rounded-lg border-2 border-dashed border-white/10 text-slate-500 text-center p-3">
                    <FilmIcon className="h-8 w-8 mb-2 text-slate-600" />
                    <span className="text-[10px]">Chưa nhập Poster URL</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumb Backdrop ngang 16:9 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  Backdrop Ngang (Tỉ lệ chuẩn 16:9)
                </label>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Tối ưu: 1280x720px
                </span>
              </div>

              <input
                type="text"
                name="thumb_url"
                value={formData.thumb_url}
                onChange={handleChange}
                placeholder="https://image.tmdb.org/t/p/original/...jpg"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none font-mono"
              />

              <div className="flex items-center justify-center p-3 rounded-lg border border-white/5 bg-black/30">
                {formData.thumb_url ? (
                  <div className="relative h-44 w-72 sm:w-80 rounded-lg overflow-hidden border border-white/20 bg-black/60 shadow-lg group">
                    <img
                      src={formData.thumb_url}
                      alt="Thumb Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {formData.name || "Preview"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-44 w-72 rounded-lg border-2 border-dashed border-white/10 text-slate-500 text-center p-3">
                    <VideoIcon className="h-8 w-8 mb-2 text-slate-600" />
                    <span className="text-[10px]">Chưa nhập Thumb URL</span>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube Trailer URL & Live Tester */}
            <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-[#121620] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <PlayIcon className="h-4 w-4 text-rose-500" />
                  <span>YouTube Trailer URL</span>
                </label>
                {youtubeVideoId && (
                  <button
                    type="button"
                    onClick={() => setShowTrailerPlayer((prev) => !prev)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer border ${
                      showTrailerPlayer
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-white/10 text-white hover:bg-white/20 border-white/15"
                    }`}
                  >
                    <PlayIcon className="h-3 w-3" />
                    <span>{showTrailerPlayer ? "Đóng trình phát" : "Xem trước Trailer"}</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ hoặc https://youtu.be/..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none font-mono"
              />

              {/* Live YouTube Iframe Preview */}
              {showTrailerPlayer && youtubeVideoId && (
                <div className="rounded-xl border border-white/[0.08] bg-black/80 p-4 space-y-3 animate-fade-in shadow-2xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <PlayIcon className="h-3.5 w-3.5 text-rose-400" />
                      <span>Trình Phát Kiểm Tra Trailer (ID: {youtubeVideoId})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTrailerPlayer(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1`}
                      title="YouTube Trailer Tester"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── BỘ SƯU TẬP HÌNH ẢNH & VIDEO (MOVIE GALLERY) ── */}
            <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-[#121620] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    <span>Bộ Sưu Tập Hình Ảnh & Video (Movie Gallery)</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {formData.galleries?.length || 0} mục
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Quản lý kho ảnh phân cảnh (stills), hậu trường (BTS), poster và backdrop phụ từ TMDb / PhimAPI.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkAddGallery((prev) => !prev)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    <LayersIcon className="h-3 w-3" />
                    <span>Dán nhanh nhiều link</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddGalleryItem}
                    className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1 text-xs font-bold text-white shadow-sm shadow-accent/25 hover:bg-accent/90 transition cursor-pointer"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    <span>Thêm mục mới</span>
                  </button>
                </div>
              </div>

              {/* Bulk Add Box */}
              {showBulkAddGallery && (
                <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-3.5 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-accent">
                      Dán danh sách URL (mỗi dòng 1 đường link hình ảnh hoặc video):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBulkAddGallery(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkGalleryText}
                    onChange={(e) => setBulkGalleryText(e.target.value)}
                    placeholder={"https://image.tmdb.org/t/p/original/photo1.jpg\nhttps://image.tmdb.org/t/p/original/photo2.jpg\nhttps://image.tmdb.org/t/p/original/photo3.jpg"}
                    className="w-full rounded-lg border border-white/15 bg-black/50 p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-accent focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkAddGallery}
                      className="rounded-lg bg-accent px-3.5 py-1 text-xs font-bold text-white hover:bg-accent/90 transition cursor-pointer"
                    >
                      Thêm vào Gallery
                    </button>
                  </div>
                </div>
              )}

              {/* Gallery Items List */}
              {(!formData.galleries || formData.galleries.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/10 text-center space-y-2">
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                  <p className="text-xs text-slate-400">Chưa có hình ảnh/video nào trong bộ sưu tập.</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFetchPhimApi()}
                      disabled={fetchingPhimApi}
                      className="text-xs text-accent hover:underline font-bold cursor-pointer"
                    >
                      ⚡ Lấy tự động từ PhimAPI
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleAddGalleryItem}
                      className="text-xs text-slate-300 hover:underline font-semibold cursor-pointer"
                    >
                      + Thêm mục thủ công
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.galleries.map((item: any, idx: number) => {
                    const isCurrentPoster = formData.poster_url === item.url;
                    const isCurrentThumb = formData.thumb_url === item.url;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col gap-2.5 rounded-xl border p-3.5 transition ${
                          isCurrentPoster || isCurrentThumb
                            ? "border-accent/40 bg-accent/[0.04]"
                            : "border-white/10 bg-black/30 hover:border-white/20"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          {/* Live Thumbnail */}
                          <div className="relative h-20 w-32 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center group">
                            {item.url ? (
                              item.media_type === "video" ? (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <VideoIcon className="h-5 w-5 text-accent" />
                                  <span className="text-[9px] mt-0.5">Video</span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={item.url}
                                    alt={item.caption || `Gallery ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition text-[10px] gap-1 font-semibold"
                                  >
                                    <ExternalLinkIcon className="h-3 w-3" />
                                    <span>Xem ảnh</span>
                                  </a>
                                </>
                              )
                            ) : (
                              <ImageIcon className="h-5 w-5 text-slate-600" />
                            )}
                          </div>

                          {/* Item Inputs */}
                          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-2">
                              <select
                                value={item.media_type || "image"}
                                onChange={(e) => handleGalleryChange(idx, "media_type", e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[#141722] px-2.5 py-1.5 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                              >
                                <option value="image">🖼️ Ảnh</option>
                                <option value="video">🎬 Video</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <select
                                value={item.type || "still"}
                                onChange={(e) => handleGalleryChange(idx, "type", e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[#141722] px-2.5 py-1.5 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                              >
                                <option value="backdrop">Backdrop (Ngang)</option>
                                <option value="poster">Poster (Dọc)</option>
                                <option value="still">Phân cảnh (Still)</option>
                                <option value="behind_the_scenes">Hậu trường (BTS)</option>
                                <option value="teaser">Teaser</option>
                                <option value="trailer">Trailer</option>
                              </select>
                            </div>

                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleGalleryChange(idx, "url", e.target.value)}
                                placeholder="URL hình ảnh hoặc video..."
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-accent focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                value={item.caption || ""}
                                onChange={(e) => handleGalleryChange(idx, "caption", e.target.value)}
                                placeholder="Chú thích ảnh..."
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryItem(idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0"
                            title="Xóa mục này"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quick action chips */}
                        {item.url && item.media_type !== "video" && (
                          <div className="flex items-center gap-2 pl-0 sm:pl-35 pt-1 flex-wrap text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSetAsPoster(item.url)}
                              className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition cursor-pointer border ${
                                isCurrentPoster
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border-white/5"
                              }`}
                            >
                              <CheckIcon className={`h-2.5 w-2.5 ${isCurrentPoster ? "text-emerald-400" : "text-slate-500"}`} />
                              <span>{isCurrentPoster ? "Đang là Poster chính" : "📌 Đặt làm Poster chính"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetAsThumb(item.url)}
                              className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold transition cursor-pointer border ${
                                isCurrentThumb
                                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border-white/5"
                              }`}
                            >
                              <CheckIcon className={`h-2.5 w-2.5 ${isCurrentThumb ? "text-sky-400" : "text-slate-500"}`} />
                              <span>{isCurrentThumb ? "Đang là Backdrop chính" : "🖼️ Đặt làm Backdrop chính"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.url);
                                toast.success("Đã sao chép link ảnh!");
                              }}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition cursor-pointer"
                            >
                              <CopyIcon className="h-2.5 w-2.5" />
                              <span>Copy link</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: THỂ LOẠI, QUỐC GIA & DIỄN VIÊN ── */}
      {activeTab === "taxonomies" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TagIcon className="h-4 w-4" />
              <span>Phân Loại Thể Loại, Quốc Gia & Diễn Viên</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gắn nhãn thể loại, quốc gia và quản lý danh sách diễn viên, đạo diễn của bộ phim.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* THỂ LOẠI */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Thể loại phim</span>
                  <span className="rounded bg-white/10 text-slate-300 px-2 py-0.2 text-[10px] font-mono">
                    Đã chọn: {formData.genre_ids.length}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllGenres}
                    className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={clearAllGenres}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Quick Search for Genres */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  placeholder="Lọc nhanh thể loại..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
                />
              </div>

              {/* Genres Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                {loadingTaxonomies ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Đang nạp danh sách thể loại...
                  </div>
                ) : filteredGenres.length === 0 ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Không tìm thấy thể loại phù hợp.
                  </div>
                ) : (
                  filteredGenres.map((g) => {
                    const isSelected = formData.genre_ids.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => toggleGenre(g.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition border cursor-pointer ${
                          isSelected
                            ? "bg-accent text-white border-accent shadow-sm"
                            : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3" />}
                        <span>{g.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* QUỐC GIA */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <GlobeIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span>Quốc gia sản xuất</span>
                  <span className="rounded bg-white/10 text-slate-300 px-2 py-0.2 text-[10px] font-mono">
                    Đã chọn: {formData.country_ids.length}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllCountries}
                    className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={clearAllCountries}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Quick Search for Countries */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Lọc nhanh quốc gia..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
                />
              </div>

              {/* Countries Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                {loadingTaxonomies ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Đang nạp danh sách quốc gia...
                  </div>
                ) : filteredCountries.length === 0 ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Không tìm thấy quốc gia phù hợp.
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = formData.country_ids.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCountry(c.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition border cursor-pointer ${
                          isSelected
                            ? "bg-accent text-white border-accent shadow-sm"
                            : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3" />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── DIỄN VIÊN (ACTORS) ── */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold text-white">Danh Sách Diễn Viên (Cast)</span>
                  <span className="rounded bg-white/10 text-slate-300 px-2 py-0.5 text-[10px] font-mono">
                    {formData.actors?.length || 0} diễn viên
                  </span>
                </div>
                {formData.actors?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllActors}
                    className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer transition"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Add Actor Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newActorName}
                  onChange={(e) => setNewActorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddActor();
                    }
                  }}
                  placeholder="Tên diễn viên (hoặc dán danh sách)..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={newActorCharacter}
                  onChange={(e) => setNewActorCharacter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddActor();
                    }
                  }}
                  placeholder="Vai diễn..."
                  className="sm:w-28 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddActor}
                  className="flex items-center justify-center gap-1 rounded-lg bg-accent/20 border border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/30 transition cursor-pointer shrink-0"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {/* Actor Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-60 overflow-y-auto">
                {formData.actors?.length === 0 ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Chưa có diễn viên nào.
                  </div>
                ) : (
                  formData.actors.map((actor: any, idx: number) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 hover:border-white/20 transition"
                    >
                      <UserIcon className="h-3 w-3 text-slate-400" />
                      <span className="font-medium text-white">{actor.name}</span>
                      {actor.character_name && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({actor.character_name})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveActor(idx)}
                        className="text-slate-500 hover:text-red-400 p-0.5 ml-0.5 transition cursor-pointer"
                        title="Xóa diễn viên"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── ĐẠO DIỄN (DIRECTORS) ── */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Đạo Diễn (Directors)</span>
                  <span className="rounded bg-white/10 text-slate-300 px-2 py-0.5 text-[10px] font-mono">
                    {formData.directors?.length || 0} đạo diễn
                  </span>
                </div>
              </div>

              {/* Add Director Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDirectorName}
                  onChange={(e) => setNewDirectorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDirector();
                    }
                  }}
                  placeholder="Tên đạo diễn (VD: Haruo Sotozaki)..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDirector}
                  className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition cursor-pointer shrink-0"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {/* Director Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-60 overflow-y-auto">
                {formData.directors?.length === 0 ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Chưa có đạo diễn nào.
                  </div>
                ) : (
                  formData.directors.map((dir: any, idx: number) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 hover:border-white/20 transition"
                    >
                      <UserIcon className="h-3 w-3 text-emerald-400" />
                      <span className="font-medium text-white">{dir.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirector(idx)}
                        className="text-slate-500 hover:text-red-400 p-0.5 ml-0.5 transition cursor-pointer"
                        title="Xóa đạo diễn"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── TỪ KHÓA & THẺ TAG (TAGS) ── */}
            <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-[#121620] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Thẻ Từ Khóa & Nhãn Phim (Tags / Keywords)</span>
                  <span className="rounded bg-white/10 text-slate-300 px-2 py-0.5 text-[10px] font-mono">
                    {formData.tags?.length || 0} từ khóa
                  </span>
                </div>
                {formData.tags?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTags}
                    className="text-[11px] text-slate-400 hover:text-red-400 cursor-pointer transition"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Add Tag Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Nhập từ khóa (nhấn Enter hoặc dán danh sách cách nhau bởi dấu phẩy)..."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="flex items-center justify-center gap-1 rounded-lg bg-sky-500/20 border border-sky-500/40 px-3.5 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/30 transition cursor-pointer shrink-0"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>Thêm thẻ</span>
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 text-[10px]">Gợi ý nhanh:</span>
                {[
                  "Anime",
                  "Manga",
                  "Phim Chiếu Rạp",
                  "Siêu Nhiên",
                  "Học Đường",
                  "Marvel",
                  "Zombie",
                  "Du Hành Thời Gian",
                  "Hành Động",
                  "Cổ Trang",
                  "Hài Hước",
                  "Tình Cảm",
                  "Kinh Dị",
                ].map((sug) => {
                  const isAdded = (formData.tags || []).some(
                    (t: string) => t.toLowerCase() === sug.toLowerCase()
                  );
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddTag(sug)}
                      disabled={isAdded}
                      className={`rounded px-2 py-0.5 text-[10px] transition cursor-pointer border ${
                        isAdded
                          ? "bg-white/5 text-slate-600 border-transparent cursor-not-allowed"
                          : "bg-white/5 text-slate-300 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-500/30 border-white/10"
                      }`}
                    >
                      +{sug}
                    </button>
                  );
                })}
              </div>

              {/* Tag Chips (Pill Badges) */}
              <div className="flex flex-wrap gap-2 pt-1 max-h-60 overflow-y-auto">
                {(!formData.tags || formData.tags.length === 0) ? (
                  <div className="py-4 text-xs text-slate-500 text-center w-full">
                    Chưa có thẻ từ khóa nào. Hãy nhập ở trên hoặc bấm &ldquo;Lấy thông tin từ PhimAPI&rdquo;.
                  </div>
                ) : (
                  formData.tags.map((tag: string, idx: number) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:border-sky-400/40 hover:bg-sky-500/10 transition"
                    >
                      <span className="text-sky-400 font-mono text-[11px]">#</span>
                      <span className="font-medium text-white">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-slate-500 hover:text-red-400 p-0.5 ml-0.5 transition cursor-pointer"
                        title="Xóa thẻ tag"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TÙY CHỌN HIỂN THỊ ── */}
      {activeTab === "display" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-4 sm:p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ActivityIcon className="h-4 w-4" />
              <span>Cài Đặt Hiển Thị & Trạng Thái Phát Sóng</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quyết định vị trí xuất hiện của tác phẩm trên các chuyên mục và trang chủ.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl">
            {/* Toggle 1: is_active */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-emerald-500/30 transition">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Bật hiển thị công khai trên website</span>
                </div>
                <p className="text-[11px] text-white/50">
                  Khi bật, người dùng có thể tìm kiếm, truy cập trang chi tiết và xem phim trực tiếp. Khi tắt, phim sẽ bị ẩn hoàn toàn với khán giả.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Toggle 2: is_featured */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-amber-500/30 transition">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <FlameIcon className="h-4 w-4 text-amber-400" />
                  <span>Đưa vào danh sách Phim Hot / Nổi Bật</span>
                </div>
                <p className="text-[11px] text-white/50">
                  Phim sẽ được hiển thị ưu tiên tại Hero Banner trang chủ và danh mục &quot;Phim Hot Thịnh Hành&quot;.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Toggle 3: is_cinema */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-purple-500/30 transition">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <FilmIcon className="h-4 w-4 text-purple-400" />
                  <span>Phim Chiếu Rạp</span>
                </div>
                <p className="text-[11px] text-white/50">
                  Đính kèm huy hiệu &quot;Chiếu Rạp&quot; và đưa phim vào chuyên mục lọc Phim Chiếu Rạp.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="is_cinema"
                  checked={formData.is_cinema}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY FOOTER ACTIONS ── */}
      <div className="sticky bottom-4 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121522]/95 backdrop-blur-md p-3.5 sm:px-5 sm:py-3 shadow-2xl">
        {/* Left: Step navigation info */}
        <div className="flex items-center gap-2">
          {activeTab !== "basic" && (
            <button
              type="button"
              onClick={() => {
                const tabs: FormStudioTab[] = ["basic", "media", "taxonomies", "display"];
                const idx = tabs.indexOf(activeTab);
                if (idx > 0) setActiveTab(tabs[idx - 1]);
              }}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              ← Tab trước
            </button>
          )}

          {activeTab !== "display" && (
            <button
              type="button"
              onClick={() => {
                const tabs: FormStudioTab[] = ["basic", "media", "taxonomies", "display"];
                const idx = tabs.indexOf(activeTab);
                if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
              }}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              Tab tiếp theo →
            </button>
          )}

          <span className="text-[11px] text-slate-400 hidden md:inline ml-2">
            {isEdit ? (
              <span>Đang chỉnh sửa: <strong className="text-white">{formData.name || initialData?.name}</strong></span>
            ) : (
              <span>Tạo mới phim</span>
            )}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/movies")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>{isEdit ? "Lưu Thay Đổi" : "Tạo Phim & Thêm Tập"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
});

export default MovieForm;
