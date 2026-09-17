export interface ScheduleMovieItem {
  id: number;
  name: string;
  originName: string | null;
  slug: string;
  thumbUrl: string;
  posterUrl: string;
  type: string;
  status: string;
  quality: string | null;
  episodeCurrent: string | null;
  episodeTotal: string | null;
  notifySchedule: string | null;
  scheduleDays: number[];
  ratingAvg: number;
  year: number | null;
  genres: string[];
}

export type WeeklyScheduleData = {
  [dayOfWeek in 0 | 1 | 2 | 3 | 4 | 5 | 6]: ScheduleMovieItem[];
};

export interface WeeklyScheduleResponse {
  status?: "success" | "error";
  success?: boolean;
  data: WeeklyScheduleData;
}

/** GET /v1/schedule?day=0-6 trả mảng phẳng 1 ngày */
export interface DayScheduleResponse {
  status?: "success" | "error";
  success?: boolean;
  data: ScheduleMovieItem[];
}
