"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CategoryCard } from "@/components/explore/category-card";
import { ExploreCreatorCard } from "@/components/explore/creator-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  fetchCategories,
  fetchNewCreators,
  fetchCreatorsByCategory,
} from "@/services/explore";
import { ExploreCategory, ExploreCreator } from "@/types";
import { getUserAddress } from "@/lib/user-session";
import { useUser } from "@/contexts/user-context";

export default function ExplorePage() {
  const { user } = useUser(); // Get actual logged-in user
  const [categories, setCategories] = useState<ExploreCategory[]>([]);
  const [newCreators, setNewCreators] = useState<ExploreCreator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<ExploreCreator[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // Fetch new creators on mount
  useEffect(() => {
    async function loadNewCreators() {
      try {
        setIsLoadingCreators(true);
        // Use actual logged-in user address for filtering
        const userAddress = user?.address;
        const data = await fetchNewCreators(6, 0, userAddress);
        setNewCreators(data);
      } catch (error) {
        console.error("Failed to load new creators:", error);
      } finally {
        setIsLoadingCreators(false);
      }
    }

    loadNewCreators();
  }, [user]); // Re-fetch when user changes

  // Handle category filter
  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsLoadingFiltered(true);

    try {
      // Use actual logged-in user address for filtering
      const userAddress = user?.address;
      const data = await fetchCreatorsByCategory(categoryName, 9, 0, userAddress);
      setFilteredCreators(data);
    } catch (error) {
      console.error("Failed to load filtered creators:", error);
    } finally {
      setIsLoadingFiltered(false);
    }
  };

  // Clear category filter
  const handleClearFilter = () => {
    setSelectedCategory(null);
    setFilteredCreators([]);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          {/* Categories Section */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">Explore by topic</h2>

            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No categories available</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => handleCategoryClick(category.name)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Filtered Creators Section (when category is selected) */}
          {selectedCategory && (
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedCategory}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilter}
                >
                  Clear filter
                </Button>
              </div>

              {isLoadingFiltered ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    No creators found in this category
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCreators.map((creator) => (
                    <ExploreCreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* New Creators Section */}
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-semibold">New on SuiPatreon</h2>

            {isLoadingCreators ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : newCreators.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No new creators to display
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {newCreators.map((creator) => (
                  <ExploreCreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
