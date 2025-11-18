"use client";

import { useState } from "react";
import { CreatePostFormData, AudienceAccess, SubscriptionTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AudienceSelector } from "./audience-selector";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  formData: CreatePostFormData;
  onFormChange: (updates: Partial<CreatePostFormData>) => void;
  availableTiers: SubscriptionTier[];
  onPreview: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function SettingsSidebar({
  formData,
  onFormChange,
  availableTiers,
  onPreview,
  onPublish,
  isPublishing = false,
}: SettingsSidebarProps) {
  const [showEmailNotifications, setShowEmailNotifications] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        onFormChange({ tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    onFormChange({ tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <aside className="w-96 shrink-0 border-l border-border bg-card">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Top Actions */}
        <div className="border-b border-border p-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={onPreview}
              type="button"
            >
              Preview post
            </Button>
            <Button
              className="w-full"
              onClick={onPublish}
              disabled={isPublishing || !formData.title.trim()}
              type="button"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm font-medium text-muted-foreground">Settings</span>
          </div>
        </div>

        {/* Scrollable Settings */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Audience Section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Audience</h3>
              <AudienceSelector
                access={formData.audience}
                onAccessChange={(access: AudienceAccess) =>
                  onFormChange({ audience: access })
                }
                selectedTiers={formData.tierIds}
                onTiersChange={(tierIds: string[]) => onFormChange({ tierIds })}
                availableTiers={availableTiers}
              />
            </div>

            {/* Emails and notifications */}
            <div>
              <button
                type="button"
                onClick={() => setShowEmailNotifications(!showEmailNotifications)}
                className="flex w-full items-center justify-between text-sm font-semibold hover:text-foreground"
              >
                <span>Emails and notifications</span>
                {showEmailNotifications ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showEmailNotifications && (
                <div className="mt-3 flex items-center justify-between">
                  <Label htmlFor="email-subscribers" className="text-sm">
                    Email subscribers
                  </Label>
                  <Toggle
                    id="email-subscribers"
                    checked={formData.emailSubscribers}
                    onCheckedChange={(checked) =>
                      onFormChange({ emailSubscribers: checked })
                    }
                  />
                </div>
              )}
            </div>

            {/* Make this a drop */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-drop" className="text-sm font-semibold">
                  Make this a drop
                </Label>
              </div>
              <Toggle
                id="is-drop"
                checked={formData.isDrop}
                onCheckedChange={(checked) => onFormChange({ isDrop: checked })}
              />
            </div>

            {/* Set publish date */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="scheduled-date" className="text-sm font-semibold">
                  Set publish date
                </Label>
              </div>
              <Toggle
                id="scheduled-date"
                checked={!!formData.scheduledDate}
                onCheckedChange={(checked) =>
                  onFormChange({
                    scheduledDate: checked ? new Date() : undefined,
                  })
                }
              />
            </div>

            {formData.scheduledDate && (
              <div className="mt-2">
                <Input
                  type="datetime-local"
                  value={
                    formData.scheduledDate
                      ? new Date(formData.scheduledDate.getTime() - formData.scheduledDate.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    onFormChange({ scheduledDate: new Date(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            )}

            {/* More settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowMoreSettings(!showMoreSettings)}
                className="flex w-full items-center justify-between text-sm font-semibold hover:text-foreground"
              >
                <span>More settings</span>
                {showMoreSettings ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showMoreSettings && (
                <div className="mt-3 space-y-4">
                  {/* Allow comments */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-comments" className="text-sm">
                      Allow comments
                    </Label>
                    <Toggle
                      id="enable-comments"
                      checked={formData.enableComments}
                      onCheckedChange={(checked) =>
                        onFormChange({ enableComments: checked })
                      }
                    />
                  </div>

                  {/* Add tags */}
                  <div>
                    <Label htmlFor="tags" className="text-sm">
                      Add tags
                    </Label>
                    <Input
                      id="tags"
                      type="text"
                      placeholder="Start typing..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagAdd}
                      className="mt-2"
                    />
                    {formData.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleTagRemove(tag)}
                              className="hover:text-foreground"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
