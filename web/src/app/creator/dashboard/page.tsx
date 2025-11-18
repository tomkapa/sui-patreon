"use client";

import { useEffect, useState } from "react";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { OverviewSection } from "@/components/creator/overview-section";
import { LatestActivity } from "@/components/creator/latest-activity";
import { RecentPosts } from "@/components/creator/recent-posts";
import {
  fetchDashboardData,
  DashboardData,
  DashboardQueryParams,
} from "@/services/dashboard";
import { Content } from "@/types";

// Mock wallet address for development
const MOCK_WALLET_ADDRESS =
  "0x1abec7f223edeb5120fab9c0cc133db6167145937fd1261777e5eeab0e87f966";

export default function CreatorDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardQueryParams>({
    creatorAddress: MOCK_WALLET_ADDRESS,
    type: "all",
    tier: "all",
    time: "all",
    search: "",
    limit: 20,
  });

  // Fetch dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardData(filters);
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<DashboardQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      cursor: undefined, // Reset cursor on filter change
    }));
  };

  // Handle load more (pagination)
  const handleLoadMore = async () => {
    if (!dashboardData?.hasMore || !dashboardData.cursor) return;

    try {
      const newData = await fetchDashboardData({
        ...filters,
        cursor: dashboardData.cursor,
      });

      setDashboardData((prev) =>
        prev
          ? {
              ...newData,
              recentPosts: [...prev.recentPosts, ...newData.recentPosts],
            }
          : newData
      );
    } catch (err) {
      console.error("Failed to load more posts:", err);
    }
  };

  // Convert dashboard data to component props
  const analytics = dashboardData
    ? {
        totalSubscribers: dashboardData.overview.totalMembers,
        monthlyRevenue: parseFloat(dashboardData.overview.totalRevenue),
        totalViews: 0, // Not provided by API
        totalLikes: dashboardData.activity.likesCount,
        totalComments: dashboardData.activity.commentsCount,
        totalImpressions: dashboardData.activity.impressionsCount,
      }
    : {
        totalSubscribers: 0,
        monthlyRevenue: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalImpressions: 0,
      };

  // Convert recent post for LatestActivity component
  const recentPost = dashboardData?.recentPost
    ? ({
        id: dashboardData.recentPost.id,
        creatorAddress: MOCK_WALLET_ADDRESS,
        title: dashboardData.recentPost.title,
        description: "",
        thumbnailUrl:
          dashboardData.recentPost.mediaUrls.length > 0
            ? dashboardData.recentPost.mediaUrls[0]
            : undefined,
        contentType: dashboardData.recentPost.mediaType as
          | "video"
          | "audio"
          | "image"
          | "text",
        tierIds: [],
        isPublic: dashboardData.recentPost.audience === "free",
        createdAt: new Date(dashboardData.recentPost.createdAt),
        viewCount: dashboardData.recentPost.viewCount,
        likeCount: dashboardData.recentPost.likeCount,
      } as Content)
    : undefined;

  // Convert recent posts for RecentPosts component
  const posts: Content[] = dashboardData
    ? dashboardData.recentPosts.map((post) => ({
        id: post.id,
        creatorAddress: MOCK_WALLET_ADDRESS,
        title: post.title,
        description: "",
        thumbnailUrl: post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined,
        contentType: post.mediaType as "video" | "audio" | "image" | "text",
        tierIds: [],
        isPublic: post.audience === "free",
        createdAt: new Date(post.createdAt),
        viewCount: post.viewCount,
        likeCount: post.likeCount,
      }))
    : [];

  return (
    <AdaptiveLayout>
      <main className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Home</h1>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboardData ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Section */}
            <OverviewSection analytics={analytics} />

            {/* Latest Activity */}
            <LatestActivity
              activities={[]} // Not needed anymore since we pass counts
              recentPost={recentPost}
              totalComments={analytics.totalComments}
              totalLikes={analytics.totalLikes}
              totalImpressions={analytics.totalImpressions}
            />

            {/* Recent Posts */}
            <RecentPosts
              posts={posts}
              tiers={[]} // Not needed for filtering with new implementation
              onFilterChange={handleFilterChange}
              onLoadMore={dashboardData?.hasMore ? handleLoadMore : undefined}
              isLoadingMore={false}
            />
          </>
        )}
      </main>
    </AdaptiveLayout>
  );
}
