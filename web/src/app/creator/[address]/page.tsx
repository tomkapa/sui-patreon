import Image from "next/image";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content/content-card";
import { CheckCircle2, Users, Calendar } from "lucide-react";
import { mockCreators, mockContent, mockTiers } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { address } = await params;

  // Mock creator data - TODO: Fetch from blockchain
  const creator = mockCreators[0]; // Using first creator as example
  const tiers = mockTiers.filter((t) => t.creatorAddress === creator.address);
  const content = mockContent.filter((c) => c.creatorAddress === creator.address);

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
                    <h1 className="text-3xl font-bold">{creator.displayName}</h1>
                    {creator.isVerified && (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  {creator.suinsName && (
                    <p className="mb-3 text-muted-foreground">{creator.suinsName}</p>
                  )}
                  <p className="mb-4 max-w-2xl">{creator.bio}</p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{formatNumber(creator.followerCount)} followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {creator.createdAt.toLocaleDateString()}</span>
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
            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold">Membership tiers</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex flex-col rounded-lg border border-border bg-card p-6"
                  >
                    <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                    <div className="mb-4 text-3xl font-bold">{tier.price} SUI/mo</div>
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

            {/* Recent Posts */}
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Recent posts</h2>
              {content.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {content.map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">No content available yet</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
