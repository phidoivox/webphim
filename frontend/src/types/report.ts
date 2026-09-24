export type ReportType =
  | "broken_link"
  | "no_sound"
  | "wrong_episode"
  | "lag"
  | "sub_error"
  | "other";

export interface CreateReportPayload {
  episode_id: number;
  server_id?: number | null;
  report_type: ReportType;
  description?: string | null;
}

export interface CreateReportResponse {
  status: "success" | "error";
  message: string;
  data?: {
    id: number;
    status: string;
    created_at?: string;
  };
}
