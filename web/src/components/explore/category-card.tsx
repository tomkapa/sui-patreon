"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ExploreCategory } from "@/types";
import { formatNumber } from "@/lib/utils";

interface CategoryCardProps {
  category: ExploreCategory;
  onClick?: () => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[
    category.iconName as keyof typeof Icons
  ] as React.ComponentType<{
    className?: string;
  }>;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link
      href={`/explore/${category.slug}`}
      onClick={handleClick}
      className="group block overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
        {IconComponent ? (
          <IconComponent className="h-6 w-6" />
        ) : (
          <Icons.Folder className="h-6 w-6" />
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold">{category.name}</h3>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {category.description}
      </p>

      {/* Creator count */}
      <p className="text-xs text-muted-foreground">
        {formatNumber(category.creatorCount)} creators
      </p>
    </Link>
  );
}
