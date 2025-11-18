"use client";

import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { OverviewSection } from "@/components/creator/overview-section";
import { LatestActivity } from "@/components/creator/latest-activity";
import { RecentPosts } from "@/components/creator/recent-posts";
import {
  mockCreatorAnalytics,
  mockActivities,
  mockCreatorPosts,
  mockTiers,
} from "@/lib/mock-data";

export default function CreatorDashboard() {
  // Mock data - TODO: Replace with real blockchain data
  const analytics = mockCreatorAnalytics;
  const activities = mockActivities;
  const posts = mockCreatorPosts;
  const tiers = mockTiers;

  // Get the most recent post for the Latest Activity section
  const recentPost = posts.length > 0 ? posts[0] : undefined;

  return (
    <AdaptiveLayout>
      <main className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Home</h1>
        </div>

        {/* Overview Section */}
        <OverviewSection analytics={analytics} />

        {/* Latest Activity */}
        <LatestActivity
          activities={activities}
          recentPost={recentPost}
          totalComments={analytics.totalComments}
          totalLikes={analytics.totalLikes}
          totalImpressions={analytics.totalImpressions}
        />

        {/* Recent Posts */}
        <RecentPosts posts={posts} tiers={tiers} />
      </main>
    </AdaptiveLayout>
  );
}
