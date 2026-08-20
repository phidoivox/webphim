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
  scheduleDayOfWeek: number;
  ratingAvg: number;
  year: number | null;
  genres: string[];
}

export type WeeklyScheduleData = {
  [dayOfWeek in 0 | 1 | 2 | 3 | 4 | 5 | 6]: ScheduleMovieItem[];
};

export interface WeeklyScheduleResponse {
  success: boolean;
  data: WeeklyScheduleData;
}
