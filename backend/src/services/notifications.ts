/**
 * Notification Service
 *
 * Handles creation and management of notifications for:
 * 1. Subscribers when creators publish new content
 * 2. Creators when they get new subscribers
 */

import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// Notification types
export const NotificationType = {
  NEW_CONTENT: 'NEW_CONTENT',
  NEW_SUBSCRIBER: 'NEW_SUBSCRIBER',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Create notifications for all active subscribers when new content is published
 *
 * @param contentId - Database ID of the content
 * @param creatorId - Database ID of the creator
 * @param tx - Optional Prisma transaction client
 */
export async function createContentNotifications(
  contentId: string,
  creatorId: string,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const client = tx || prisma;

  try {
    // Get content details
    const content = await client.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      console.error(`[Notifications] Content not found: ${contentId}`);
      return 0;
    }

    // Get creator details
    const creator = await client.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      console.error(`[Notifications] Creator not found: ${creatorId}`);
      return 0;
    }

    // Find all tiers associated with this content
    const contentTiers = await client.contentTier.findMany({
      where: { contentId: content.id },
      select: { tierId: true },
    });

    // Get all tier IDs for this content
    const tierIds = contentTiers.map((ct) => ct.tierId);

    // If no tiers, content is accessible to all - no notifications needed
    // (This matches the access logic in content routes)
    if (tierIds.length === 0) {
      console.log(`[Notifications] Content ${content.title} has no tier requirements, skipping notifications`);
      return 0;
    }

    // Find all active subscribers to these tiers
    const activeSubscriptions = await client.subscription.findMany({
      where: {
        tierId: { in: tierIds },
        isActive: true,
        startsAt: { lte: new Date() },
        expiresAt: { gte: new Date() },
      },
      select: {
        subscriber: true,
      },
      distinct: ['subscriber'], // Avoid duplicate notifications for users subscribed to multiple tiers
    });

    if (activeSubscriptions.length === 0) {
      console.log(`[Notifications] No active subscribers found for content ${content.title}`);
      return 0;
    }

    // For each subscriber, we need to find their Creator record (if they are a creator)
    // Since subscribers are stored by address, we need to map address -> Creator.id
    const subscriberAddresses = activeSubscriptions.map((sub) => sub.subscriber);

    const subscriberCreators = await client.creator.findMany({
      where: {
        address: { in: subscriberAddresses },
      },
      select: {
        id: true,
        address: true,
      },
    });

    // Create a map of address -> Creator.id
    const addressToCreatorId = new Map<string, string>();
    subscriberCreators.forEach((sc) => {
      addressToCreatorId.set(sc.address, sc.id);
    });

    // Create notifications only for subscribers who are also creators
    const notifications: Prisma.NotificationCreateManyInput[] = [];

    for (const sub of activeSubscriptions) {
      const recipientId = addressToCreatorId.get(sub.subscriber);

      // Skip if subscriber is not a creator (no recipientId)
      if (!recipientId) {
        continue;
      }

      notifications.push({
        recipientId: recipientId,
        type: NotificationType.NEW_CONTENT,
        title: `New post from ${creator.name}`,
        message: `${creator.name} published new content: ${content.title}`,
        actorId: creator.address,
        actorName: creator.name,
        contentId: content.id,
        isRead: false,
      });
    }

    if (notifications.length === 0) {
      console.log(
        `[Notifications] No creator-subscribers found for content ${content.title}`
      );
      return 0;
    }

    // Bulk insert notifications
    const result = await client.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    console.log(
      `[Notifications] Created ${result.count} notifications for content ${content.title}`
    );

    return result.count;
  } catch (error) {
    console.error('[Notifications] Error creating content notifications:', error);
    throw error;
  }
}

/**
 * Create notification for creator when they get a new subscriber
 *
 * @param creatorId - Database ID of the creator
 * @param subscriberAddress - Blockchain address of the subscriber
 * @param tierName - Name of the tier subscribed to
 * @param tx - Optional Prisma transaction client
 */
export async function createSubscriberNotification(
  creatorId: string,
  subscriberAddress: string,
  tierName: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma;

  try {
    // Get creator details
    const creator = await client.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      console.error(`[Notifications] Creator not found: ${creatorId}`);
      return;
    }

    // Try to get subscriber's name (if they are a creator)
    const subscriberCreator = await client.creator.findUnique({
      where: { address: subscriberAddress },
      select: { name: true },
    });

    const subscriberName = subscriberCreator?.name || formatAddress(subscriberAddress);

    // Create notification
    await client.notification.create({
      data: {
        recipientId: creatorId,
        type: NotificationType.NEW_SUBSCRIBER,
        title: 'New subscriber!',
        message: `${subscriberName} subscribed to your ${tierName} tier`,
        actorId: subscriberAddress,
        actorName: subscriberName,
        contentId: null,
        isRead: false,
      },
    });

    console.log(
      `[Notifications] Created subscriber notification for creator ${creator.name}`
    );
  } catch (error) {
    console.error('[Notifications] Error creating subscriber notification:', error);
    throw error;
  }
}

/**
 * Format blockchain address for display
 * Shows first 6 and last 4 characters
 */
function formatAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get notifications for a creator
 *
 * @param creatorId - Database ID of the creator
 * @param options - Query options
 */
export async function getNotifications(
  creatorId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  // Enforce max limit
  const safeLimit = Math.min(limit, 50);

  try {
    const whereClause: Prisma.NotificationWhereInput = {
      recipientId: creatorId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.notification.count({
      where: whereClause,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: creatorId,
        isRead: false,
      },
    });

    return {
      notifications,
      unreadCount,
      total,
    };
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 *
 * @param notificationId - Database ID of the notification
 * @param creatorId - Database ID of the creator (for authorization)
 */
export async function markNotificationAsRead(
  notificationId: string,
  creatorId: string
): Promise<boolean> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: creatorId, // Ensure user owns this notification
      },
      data: {
        isRead: true,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error('[Notifications] Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a creator
 *
 * @param creatorId - Database ID of the creator
 */
export async function markAllNotificationsAsRead(creatorId: string): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: creatorId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result.count;
  } catch (error) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a creator
 *
 * @param creatorId - Database ID of the creator
 */
export async function getUnreadCount(creatorId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        recipientId: creatorId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    throw error;
  }
}
