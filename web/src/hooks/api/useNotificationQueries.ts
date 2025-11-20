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
  address: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch notifications list.
 */
export function useNotifications(
  { address, unreadOnly, limit = 20, offset = 0 }: UseNotificationsParams,
  options?: NotificationsQueryOptions
) {
  return useQuery({
    queryKey: ["notifications", address, unreadOnly, limit, offset],
    queryFn: () => fetchNotifications(address, unreadOnly, limit, offset),
    ...options,
  });
}

/**
 * Fetch unread notification count.
 */
export function useUnreadNotificationCount(
  address: string,
  options?: Omit<
    UseQueryOptions<number, Error, number, unknown[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["notifications", "unreadCount", address],
    queryFn: () => fetchUnreadCount(address),
    ...options,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationAsRead(
  options?: UseMutationOptions<void, Error, { address: string; notificationId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ address, notificationId }: { address: string; notificationId: string }) =>
      markAsRead(address, notificationId),
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
  options?: UseMutationOptions<number, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (address: string) => markAllAsRead(address),
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

