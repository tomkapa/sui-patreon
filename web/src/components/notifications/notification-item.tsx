"use client";

import { Notification } from "@/types";
import { FileText, UserPlus } from "lucide-react";
import { formatNotificationTime } from "@/services/notifications";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const Icon = notification.type === "NEW_CONTENT" ? FileText : UserPlus;
  const iconBgColor =
    notification.type === "NEW_CONTENT"
      ? "bg-blue-500/10 text-blue-500"
      : "bg-green-500/10 text-green-500";

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "w-full text-left transition-colors hover:bg-accent",
        compact ? "px-4 py-3" : "px-6 py-4",
        notification.isRead
          ? "bg-transparent"
          : "bg-primary/5 dark:bg-primary/10"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
            iconBgColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm",
                notification.isRead
                  ? "font-normal text-foreground"
                  : "font-semibold text-foreground"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatNotificationTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
