import Link from "next/link";
import * as Icons from "lucide-react";
import { TopicCategory } from "@/types";
import { formatNumber, topicNameToSlug } from "@/lib/utils";

interface TopicCardProps {
  topic: TopicCategory;
}

export function TopicCard({ topic }: TopicCardProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[topic.iconName as keyof typeof Icons] as React.ComponentType<{
    className?: string;
  }>;

  const categorySlug = topicNameToSlug(topic.name);

  return (
    <Link
      href={`/explore/${categorySlug}`}
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
      <h3 className="mb-2 text-lg font-semibold">{topic.name}</h3>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{topic.description}</p>

      {/* Creator count */}
      <p className="text-xs text-muted-foreground">
        {formatNumber(topic.creatorCount)} creators
      </p>
    </Link>
  );
}
