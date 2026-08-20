export type NotificationIconType = "episode" | "comment" | "like" | "system" | "vip";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  iconType: NotificationIconType;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  extra?: {
    movieId?: number | null;
    movieName?: string | null;
    movieSlug?: string | null;
    posterUrl?: string | null;
    episodeName?: string | null;
    replierName?: string | null;
    likerName?: string | null;
  };
}

export interface NotificationPaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  unreadCount: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  meta: NotificationPaginationMeta;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface BroadcastNotificationPayload {
  title: string;
  message: string;
  link?: string | null;
  send_mail?: boolean;
}

export interface BroadcastNotificationResponse {
  success: boolean;
  message: string;
  data: {
    sentCount: number;
    sendMail: boolean;
  };
}
