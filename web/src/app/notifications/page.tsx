"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Notification } from "@/types";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "@/services/notifications";
import { useUser } from "@/contexts/user-context";

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (user?.address) {
      loadNotifications();
    }
  }, [activeTab, user?.address]);

  const loadNotifications = async () => {
    if (!user?.address) return;

    try {
      setIsLoading(true);
      const unreadOnly = activeTab === "unread";
      const response = await fetchNotifications(user.address, unreadOnly, 50, 0);
      setNotifications(response.notifications);
      setTotalCount(response.total);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.address) return;

    // Mark as read
    if (!notification.isRead) {
      try {
        await markAsRead(user.address, notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate if there's a content ID
    if (notification.contentId) {
      router.push(`/content/${notification.contentId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.address) return;

    try {
      setIsMarkingAllRead(true);
      await markAllAsRead(user.address);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          <div className="container max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Stay updated with your creators and subscribers
                </p>
              </div>
              {hasUnread && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                >
                  {isMarkingAllRead ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    "Mark all as read"
                  )}
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">
                  All {totalCount > 0 && `(${totalCount})`}
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 px-4 text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                      No notifications yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You will see notifications here when creators you follow post new
                      content or when you get new subscribers.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 px-4 text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                      No unread notifications
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You are all caught up! Check back later for new updates.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
