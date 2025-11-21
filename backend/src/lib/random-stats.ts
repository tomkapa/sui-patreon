/**
 * Utility functions for generating random statistics
 *
 * TODO: Replace with actual database-tracked statistics
 * These functions provide placeholder data until proper tracking is implemented:
 * - View counts should be incremented when content is viewed
 * - Like counts should be tracked via user interactions
 * - Subscriber/follower counts are currently real, but we fake them to make the frontend look better
 */

/**
 * Generate a random view count for content
 * Range: 0-5000 views
 *
 * TODO: Replace with actual view tracking from database
 */
export function getRandomViewCount(): number {
  return Math.floor(Math.random() * 5000);
}

/**
 * Generate a random like count for content
 * Range: 0-500 likes
 *
 * TODO: Replace with actual like tracking from database
 */
export function getRandomLikeCount(): number {
  return Math.floor(Math.random() * 500);
}

/**
 * Generate a random subscriber/follower count
 * Range: 10-5000 subscribers
 *
 * TODO: This currently overrides real subscriber counts to make the frontend look better.
 * Remove this once we have enough real users.
 */
export function getRandomSubscriberCount(): number {
  return Math.floor(Math.random() * 4990) + 10; // 10-5000
}

/**
 * Generate a random subscriber count for a tier
 * Range: 5-500 subscribers per tier
 *
 * TODO: This currently overrides real tier subscriber counts to make the frontend look better.
 * Remove this once we have enough real users.
 */
export function getRandomTierSubscriberCount(): number {
  return Math.floor(Math.random() * 495) + 5; // 5-500
}

/**
 * Get stats for content (views and likes)
 * Uses stored database values if non-zero, otherwise returns random values
 *
 * TODO: Remove fallback to random values once proper tracking is implemented
 */
export function getContentStats(storedViewCount: number, storedLikeCount: number) {
  return {
    viewCount: storedViewCount > 0 ? storedViewCount : getRandomViewCount(),
    likeCount: storedLikeCount > 0 ? storedLikeCount : getRandomLikeCount(),
  };
}

/**
 * Get faked subscriber/follower count
 * Always returns a random value to make the frontend look populated
 *
 * TODO: Remove this and use actual subscriber counts once we have enough real users
 */
export function getFakedSubscriberCount(actualCount: number): number {
  // Always return random value to make frontend look better
  // You can optionally add the actual count to the random value if you want
  return getRandomSubscriberCount();
}

/**
 * Get faked tier subscriber count
 * Always returns a random value to make the frontend look populated
 *
 * TODO: Remove this and use actual tier subscriber counts once we have enough real users
 */
export function getFakedTierSubscriberCount(actualCount: number): number {
  // Always return random value to make frontend look better
  return getRandomTierSubscriberCount();
}
