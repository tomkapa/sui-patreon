import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CreatorCard } from "@/components/creator/creator-card";
import { TopicCard } from "@/components/creator/topic-card";
import { mockCreators, mockTopics } from "@/lib/mock-data";

export default function ExplorePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          {/* Topics Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Explore by topic</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </section>

          {/* New on Platform Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">New on SuiPatreon</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockCreators.slice(2, 5).map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </section>

          {/* Category Sections */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Visual Arts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockCreators
                .filter((c) => c.category === "Visual Arts")
                .map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Music</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockCreators
                .filter((c) => c.category === "Music")
                .map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Technology</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockCreators
                .filter((c) => c.category === "Technology")
                .map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
