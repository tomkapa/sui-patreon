"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./notification-item";
import { Notification } from "@/types";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "@/services/notifications";
import { useUser } from "@/contexts/user-context";

interface NotificationDropdownProps {
  children: React.ReactNode;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDropdown({
  children,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && user?.address) {
      loadNotifications();
    }
  }, [isOpen, user?.address]);

  const loadNotifications = async () => {
    if (!user?.address) return;

    try {
      setIsLoading(true);
      const response = await fetchNotifications(user.address, false, 10, 0);
      setNotifications(response.notifications);
      onUnreadCountChange?.(response.unreadCount);
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
        // Update unread count
        const unreadCount = notifications.filter(
          (n) => !n.isRead && n.id !== notification.id
        ).length;
        onUnreadCountChange?.(unreadCount);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate if there's a content ID
    if (notification.contentId) {
      setIsOpen(false);
      router.push(`/content/${notification.contentId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.address) return;

    try {
      setIsMarkingAllRead(true);
      await markAllAsRead(user.address);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/notifications");
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[500px] overflow-hidden bg-card border-border p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You will see notifications here when creators you follow post new
                content or when you get new subscribers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full text-sm text-primary hover:text-primary hover:bg-primary/10"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
