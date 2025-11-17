"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const topics = [
  "All",
  "Travel",
  "Movies & shows",
  "Motorsports",
  "Podcasts & shows",
  "Lifestyle",
  "Visual arts",
  "Sports",
  "Entertainment",
  "Pop culture",
  "Comedy",
  "Role play",
];

export function TopicFilters() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card hover:bg-accent"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveFilter(topic)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === topic
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-accent"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card hover:bg-accent"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
