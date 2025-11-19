"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/services/notifications";
import { NotificationsResponse } from "@/types";

type NotificationsQueryOptions = Omit<
  UseQueryOptions<NotificationsResponse, Error, NotificationsResponse, unknown[]>,
  "queryKey" | "queryFn"
>;

interface UseNotificationsParams {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch notifications list.
 */
export function useNotifications(
  { unreadOnly, limit = 20, offset = 0 }: UseNotificationsParams = {},
  options?: NotificationsQueryOptions
) {
  return useQuery({
    queryKey: ["notifications", unreadOnly, limit, offset],
    queryFn: () => fetchNotifications(unreadOnly, limit, offset),
    ...options,
  });
}

/**
 * Fetch unread notification count.
 */
export function useUnreadNotificationCount(
  options?: Omit<
    UseQueryOptions<number, Error, number, unknown[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: fetchUnreadCount,
    ...options,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationAsRead(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unreadCount"],
      });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsAsRead(
  options?: UseMutationOptions<number, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unreadCount"],
      });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

