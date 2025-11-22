"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllTopics } from "@/lib/topics";

interface TopicFiltersProps {
  selectedTopic: number | null; // null means "All"
  onTopicChange: (topic: number | null) => void;
}

export function TopicFilters({ selectedTopic, onTopicChange }: TopicFiltersProps) {
  const topics = getAllTopics();

  return (
    <div className="relative mb-4 sm:mb-6">
      <div className="flex items-center gap-2">
        {/* Scroll buttons - hidden on mobile */}
        <button
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-card hover:bg-accent shrink-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 sm:gap-3 pb-2 sm:pb-0">
            {/* All filter */}
            <button
              onClick={() => onTopicChange(null)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedTopic === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-accent"
              }`}
            >
              All
            </button>

            {/* Topic filters */}
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicChange(topic.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTopic === topic.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-accent"
                }`}
              >
                {topic.displayName}
              </button>
            ))}
          </div>
        </div>

        <button
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-card hover:bg-accent shrink-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
