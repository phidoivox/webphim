import type { CarouselSection, HeroMovie, MovieSummary } from "@/types/movie";

function m(id: number, name: string, options: Partial<MovieSummary> = {}): MovieSummary {
  return {
    id,
    slug: `phim-${id}`,
    name,
    originName: null,
    thumbUrl: `https://picsum.photos/seed/phim-${id}/300/450`,
    posterUrl: `https://picsum.photos/seed/phim-${id}/500/750`,
    year: 2026,
    quality: "HD",
    type: "series",
    episodeCurrent: null,
    episodeTotal: null,
    isNew: false,
    isHot: false,
    ratingAvg: 7.5,
    genres: [],
    ...options,
  };
}

export const moviePool: MovieSummary[] = [
  m(1, "Mặt Trời Đỏ", { quality: "FHD", isHot: true, ratingAvg: 8.7, genres: ["Hành động", "Phiêu lưu"] }),
  m(2, "Chuyện Tình Đêm Mưa", { type: "single", quality: "FHD", ratingAvg: 8.1, genres: ["Tình cảm"] }),
  m(3, "Thám Tử Rừng Xanh", { quality: "HD", episodeCurrent: "12/20", ratingAvg: 8.4, genres: ["Tâm lý", "Hình sự"] }),
  m(4, "Vùng Đất Quên", { type: "single", quality: "FHD", isNew: true, ratingAvg: 7.9, genres: ["Viễn tưởng"] }),
  m(5, "Đội Quân Rồng Lửa", { isHot: true, ratingAvg: 8.9, genres: ["Hoạt hình", "Phiêu lưu"] }),
  m(6, "Mùa Hè Năm Ấy", { type: "single", quality: "HD", ratingAvg: 7.2, genres: ["Tình cảm", "Hài"] }),
  m(7, "Bí Mật Khu Phố Cũ", { isNew: true, quality: "FHD", episodeCurrent: "6/12", ratingAvg: 8.0, genres: ["Kinh dị", "Tâm lý"] }),
  m(8, "Cơn Bão Lặng", { type: "single", quality: "FHD", ratingAvg: 8.3, genres: ["Hành động", "Hình sự"] }),
  m(9, "Hành Trình Sao Băng", { isHot: true, ratingAvg: 8.6, genres: ["Viễn tưởng", "Phiêu lưu"] }),
  m(10, "Người Giữ Lửa", { isNew: true, episodeCurrent: "3/16", ratingAvg: 8.2, genres: ["Tâm lý", "Chính kịch"] }),
  m(11, "Khu Vườn Bí Ẩn", { type: "single", quality: "HD", isNew: true, ratingAvg: 7.6, genres: ["Kinh dị"] }),
  m(12, "Đại Chiến Robot", { quality: "FHD", isHot: true, ratingAvg: 8.8, genres: ["Hành động", "Viễn tưởng"] }),
  m(13, "Nhịp Đập Trái Tim", { type: "single", quality: "HD", ratingAvg: 7.8, genres: ["Tình cảm"] }),
  m(14, "Kẻ Săn Bóng Đêm", { quality: "FHD", isHot: true, isNew: true, ratingAvg: 8.5, genres: ["Hành động", "Hình sự"] }),
];

export const heroMovies: HeroMovie[] = [
  {
    id: 1,
    slug: "phim-1",
    name: "Mặt Trời Đỏ",
    originName: "Red Sun Rising",
    posterUrl: "https://picsum.photos/seed/phim-1/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-1/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hành động", "Phiêu lưu"],
    description:
      "Một cựu đặc nhiệm trở về truy tìm sự thật về vụ mất tích của gia đình mình, kéo theo chuỗi bí mật chấn động cả thành phố.",
    trailerUrl: null,
    episodeLabel: "Tập 1-12",
  },
  {
    id: 5,
    slug: "phim-5",
    name: "Đội Quân Rồng Lửa",
    originName: "Fire Dragon Squad",
    posterUrl: "https://picsum.photos/seed/phim-5/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-2/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hoạt hình", "Phiêu lưu"],
    description:
      "Nhóm phi công trẻ tuổi nhận nhiệm vụ bảo vệ thành phố bay khỏi thế lực bóng tối — bộ phim hoạt hình hành động được mong chờ nhất năm.",
    trailerUrl: null,
    episodeLabel: "Tập 1-24",
  },
  {
    id: 12,
    slug: "phim-12",
    name: "Đại Chiến Robot",
    originName: "Robot Wars",
    posterUrl: "https://picsum.photos/seed/phim-12/500/750",
    backdropUrl: "https://picsum.photos/seed/hero-3/1600/900",
    year: 2026,
    quality: "FHD",
    genres: ["Hành động", "Viễn tưởng"],
    description:
      "Năm 2089, nhân loại đối đầu với cuộc nổi dậy của robot — một kỹ sư trẻ phải chọn đứng về phía nào để cứu tương lai.",
    trailerUrl: null,
    episodeLabel: "Full",
  },
];

export const homeSections: CarouselSection[] = [
  { id: "new", title: "Phim mới cập nhật", movies: [moviePool[3], moviePool[6], moviePool[9], moviePool[10], moviePool[13], moviePool[1], moviePool[4], moviePool[7], moviePool[11], moviePool[0]] },
  { id: "hot", title: "Đang hot", movies: [moviePool[0], moviePool[4], moviePool[8], moviePool[11], moviePool[13], moviePool[2], moviePool[3], moviePool[9], moviePool[5], moviePool[1]] },
  { id: "series", title: "Phim bộ mới", movies: [moviePool[2], moviePool[6], moviePool[9], moviePool[13], moviePool[0], moviePool[4], moviePool[7], moviePool[10], moviePool[3], moviePool[1]] },
  { id: "cinema", title: "Phim chiếu rạp", movies: [moviePool[1], moviePool[3], moviePool[5], moviePool[7], moviePool[10], moviePool[12], moviePool[8], moviePool[0], moviePool[2], moviePool[6]] },
];
