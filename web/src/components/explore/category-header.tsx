import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";

interface CategoryHeaderProps {
  categoryName: string;
  description?: string;
  creatorCount?: number;
  iconName?: string;
}

export function CategoryHeader({
  categoryName,
  description,
  creatorCount,
  iconName,
}: CategoryHeaderProps) {
  // Dynamically get the icon component
  const IconComponent = iconName
    ? (Icons[iconName as keyof typeof Icons] as React.ComponentType<{
        className?: string;
      }>)
    : null;

  return (
    <div className="mb-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>
      </div>

      {/* Category Header */}
      <div className="flex items-start gap-4">
        {IconComponent && (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconComponent className="h-8 w-8" />
          </div>
        )}

        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-bold">{categoryName}</h1>

          {description && (
            <p className="mb-2 text-muted-foreground">{description}</p>
          )}

          {creatorCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {creatorCount.toLocaleString()} {creatorCount === 1 ? "creator" : "creators"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
