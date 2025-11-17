import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CreatorCard } from "@/components/creator/creator-card";
import { CategoryHeader } from "@/components/explore/category-header";
import { mockCreators, mockTopics } from "@/lib/mock-data";
import { topicNameToSlug } from "@/lib/utils";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;

  // Find matching topic from mockTopics
  const topic = mockTopics.find(
    (t) => topicNameToSlug(t.name) === categorySlug
  );

  // If no topic found, show 404
  if (!topic) {
    notFound();
  }

  // Filter creators by category name
  // Note: We match against creator.category field
  const filteredCreators = mockCreators.filter(
    (creator) => topicNameToSlug(creator.category) === categorySlug
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          <CategoryHeader
            categoryName={topic.name}
            description={topic.description}
            creatorCount={filteredCreators.length}
            iconName={topic.iconName}
          />

          {/* Creators Grid */}
          {filteredCreators.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-center">
              <h3 className="mb-2 text-xl font-semibold">
                No creators found in this category
              </h3>
              <p className="mb-4 text-muted-foreground">
                Check back later or explore other categories to discover amazing
                creators.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Generate static params for known categories (optional, for better performance)
export async function generateStaticParams() {
  return mockTopics.map((topic) => ({
    category: topicNameToSlug(topic.name),
  }));
}
