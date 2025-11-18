"use client";

import { MediaType } from "@/types";
import { Video, Music, Image as ImageIcon, Link2, Paperclip, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MediaTypeSelectorProps {
  selectedType?: MediaType;
  onTypeSelect: (type: MediaType) => void;
}

const mediaTypes: Array<{ type: MediaType; icon: typeof Video; label: string }> = [
  { type: "video", icon: Video, label: "Video" },
  { type: "audio", icon: Music, label: "Audio" },
  { type: "image", icon: ImageIcon, label: "Image" },
  { type: "link", icon: Link2, label: "Link" },
  { type: "attachment", icon: Paperclip, label: "Attachment" },
];

export function MediaTypeSelector({ selectedType, onTypeSelect }: MediaTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {mediaTypes.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          type="button"
          variant={selectedType === type ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeSelect(type)}
          className="gap-2"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-2">
        <MoreHorizontal className="h-4 w-4" />
        More
      </Button>
    </div>
  );
}
