"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content/content-card";
import { CheckCircle2, Users, Calendar, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useVisitTracking } from "@/hooks/useVisitTracking";
import { fetchCreatorProfile, CreatorProfileData } from "@/services/creator";
import { use } from "react";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default function CreatorProfilePage({ params }: PageProps) {
  const { address } = use(params);
  const { trackCreatorVisit } = useVisitTracking();

  const [profileData, setProfileData] = useState<CreatorProfileData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCreatorProfile(address);
      setProfileData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load creator profile";
      setError(errorMessage);
      console.error("Error loading creator profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Track visit when page loads
  useEffect(() => {
    if (address) {
      trackCreatorVisit(address);
    }
  }, [address, trackCreatorVisit]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 pl-64">
          <Header />
          <main>
            {/* Cover Image Skeleton */}
            <div className="h-64 w-full animate-pulse bg-muted" />

            {/* Profile Info Skeleton */}
            <div className="border-b border-border bg-card px-6 py-6">
              <div className="mx-auto max-w-5xl">
                <div className="flex items-start gap-6">
                  {/* Avatar Skeleton */}
                  <div className="relative -mt-16 h-32 w-32 flex-shrink-0 animate-pulse rounded-full bg-muted" />

                  {/* Info Skeleton */}
                  <div className="flex-1 space-y-3 pt-4">
                    <div className="h-8 w-64 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-96 animate-pulse rounded bg-muted" />
                    <div className="flex gap-6">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </div>
                  </div>

                  {/* Button Skeleton */}
                  <div className="h-10 w-32 animate-pulse rounded bg-muted pt-4" />
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="mx-auto max-w-5xl px-6 py-8">
              <div className="mb-6 h-8 w-64 animate-pulse rounded bg-muted" />
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 pl-64">
          <Header />
          <main className="flex items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="mb-4 flex justify-center">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Error Loading Profile</h1>
              <p className="mb-6 text-muted-foreground">{error}</p>
              <Button onClick={loadProfile}>Try Again</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // No data (shouldn't happen if loading/error handled correctly)
  if (!profileData) {
    return null;
  }

  const { creator, tiers, recentPosts } = profileData;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main>
          {/* Cover Image */}
          <div className="relative h-64 w-full overflow-hidden bg-muted">
            {creator.coverImageUrl ? (
              <Image
                src={creator.coverImageUrl}
                alt={`${creator.displayName} cover`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-6xl font-bold text-muted-foreground/20">
                  {creator.displayName[0]}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="border-b border-border bg-card px-6 py-6">
            <div className="mx-auto max-w-5xl">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative -mt-16 h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-background">
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="text-3xl font-bold">
                      {creator.displayName}
                    </h1>
                    {creator.isVerified && (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  {creator.suinsName && (
                    <p className="mb-3 text-muted-foreground">
                      {creator.suinsName}
                    </p>
                  )}
                  <p className="mb-4 max-w-2xl">{creator.bio}</p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{formatNumber(creator.followerCount)} followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Joined {creator.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {creator.category}
                    </span>
                  </div>
                </div>

                {/* Subscribe Button */}
                <div className="pt-4">
                  <Button size="lg">Subscribe</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs & Content */}
          <div className="mx-auto max-w-5xl px-6 py-8">
            {/* Subscription Tiers */}
            {tiers.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-semibold">
                  Membership tiers
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex flex-col rounded-lg border border-border bg-card p-6"
                    >
                      <h3 className="mb-2 text-xl font-semibold">
                        {tier.name}
                      </h3>
                      <p className="mb-4 flex-1 text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                      <div className="mb-4 text-3xl font-bold">
                        {tier.price} SUI/mo
                      </div>
                      <ul className="mb-6 space-y-2 text-sm">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full">Subscribe</Button>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        {formatNumber(tier.subscriberCount)} subscribers
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state for no tiers */}
            {tiers.length === 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-semibold">
                  Membership tiers
                </h2>
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    No membership tiers available yet
                  </p>
                </div>
              </section>
            )}

            {/* Recent Posts */}
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Recent posts</h2>
              {recentPosts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recentPosts.map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    No content available yet
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
