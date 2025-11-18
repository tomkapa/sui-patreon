import { Notification, NotificationsResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Mock notifications data for development
 */
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "NEW_CONTENT",
    title: "New post from Sarah Chen",
    message: "Sarah Chen published: Guide to Web3 Design",
    actorName: "Sarah Chen",
    contentId: "content-123",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2",
    type: "NEW_SUBSCRIBER",
    title: "New subscriber!",
    message: "John Doe subscribed to your Premium tier",
    actorName: "John Doe",
    contentId: null,
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "3",
    type: "NEW_CONTENT",
    title: "New post from Alex Rivera",
    message: "Alex Rivera published: Building on Sui Blockchain",
    actorName: "Alex Rivera",
    contentId: "content-456",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: "4",
    type: "NEW_SUBSCRIBER",
    title: "New subscriber!",
    message: "Jane Smith subscribed to your Basic tier",
    actorName: "Jane Smith",
    contentId: null,
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
  },
  {
    id: "5",
    type: "NEW_CONTENT",
    title: "New post from Mike Johnson",
    message: "Mike Johnson published: Advanced Move Programming",
    actorName: "Mike Johnson",
    contentId: "content-789",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "6",
    type: "NEW_SUBSCRIBER",
    title: "New subscriber!",
    message: "Emily Davis subscribed to your VIP tier",
    actorName: "Emily Davis",
    contentId: null,
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: "7",
    type: "NEW_CONTENT",
    title: "New post from David Lee",
    message: "David Lee published: zkLogin Integration Tutorial",
    actorName: "David Lee",
    contentId: "content-012",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
];

let notificationState = [...mockNotifications];

/**
 * Fetch notifications list
 */
export async function fetchNotifications(
  unreadOnly?: boolean,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationsResponse> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(
    //   `${API_BASE_URL}/api/notifications?unreadOnly=${unreadOnly}&limit=${limit}&offset=${offset}`
    // );
    // if (!response.ok) throw new Error("Failed to fetch notifications");
    // return await response.json();

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

    let filtered = [...notificationState];
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    const total = filtered.length;
    const unreadCount = notificationState.filter((n) => !n.isRead).length;
    const notifications = filtered.slice(offset, offset + limit);

    return {
      notifications,
      unreadCount,
      total,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Fetch unread notification count
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`);
    // if (!response.ok) throw new Error("Failed to fetch unread count");
    // const data = await response.json();
    // return data.count;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 100));
    return notificationState.filter((n) => !n.isRead).length;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    //   method: "POST",
    // });
    // if (!response.ok) throw new Error("Failed to mark notification as read");

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 100));
    const notification = notificationState.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    //   method: "POST",
    // });
    // if (!response.ok) throw new Error("Failed to mark all as read");
    // const data = await response.json();
    // return data.count;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 200));
    let count = 0;
    notificationState.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    return count;
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
