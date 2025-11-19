import { Notification, NotificationsResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Fetch notifications list
 */
export async function fetchNotifications(
  address: string,
  unreadOnly?: boolean,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications?address=${address}&unreadOnly=${unreadOnly}&limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const data = await response.json();

    // Convert createdAt strings to Date objects
    const notifications = data.notifications.map((notification: any) => ({
      ...notification,
      createdAt: new Date(notification.createdAt),
    }));

    return {
      notifications,
      unreadCount: data.unreadCount,
      total: data.total,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Fetch unread notification count
 */
export async function fetchUnreadCount(address: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count?address=${address}`);
    if (!response.ok) throw new Error("Failed to fetch unread count");
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(address: string, notificationId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read?address=${address}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(address: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all?address=${address}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to mark all as read");
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Format timestamp for display
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    // Show date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
