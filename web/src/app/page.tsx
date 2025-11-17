import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CreatorCard } from "@/components/creator/creator-card";
import { TopicFilters } from "@/components/home/topic-filters";
import { ScrollableSection } from "@/components/home/scrollable-section";
import { mockCreators } from "@/lib/mock-data";

export default function HomePage() {
  // Mock data - split creators into sections with more items
  const recentlyVisited = mockCreators.slice(0, 6);
  const creatorsForYou = mockCreators.slice(0, 8);
  const popularThisWeek = mockCreators.slice(2, 10);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          {/* Topic Filters */}
          <TopicFilters />

          {/* Recently Visited Section */}
          {recentlyVisited.length > 0 && (
            <ScrollableSection title="Recently visited">
              {recentlyVisited.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} variant="compact" />
              ))}
            </ScrollableSection>
          )}

          {/* Creators For You Section */}
          <ScrollableSection title="Creators for you" showSeeAll seeAllHref="/explore">
            {creatorsForYou.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} variant="compact" />
            ))}
          </ScrollableSection>

          {/* Popular This Week Section */}
          <ScrollableSection title="Popular this week" showSeeAll seeAllHref="/explore">
            {popularThisWeek.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} variant="compact" />
            ))}
          </ScrollableSection>

          {/* Empty State for Non-Logged In Users */}
          <section className="mt-12 rounded-lg border border-border bg-card p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Start supporting creators</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your wallet to discover and support amazing creators on the Sui blockchain
            </p>
            <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Connect Wallet
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
