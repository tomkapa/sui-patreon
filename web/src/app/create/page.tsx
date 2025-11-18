"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatePostFormData, MediaType } from "@/types";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { MediaTypeSelector } from "@/components/content/media-type-selector";
import { SettingsSidebar } from "@/components/content/settings-sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { mockTiers } from "@/lib/mock-data";
import { validateCreatePost, ValidationError } from "@/lib/validation";
import { FileText } from "lucide-react";

const defaultFormData: CreatePostFormData = {
  title: "",
  content: "",
  mediaType: undefined,
  mediaUrl: undefined,
  audience: "free",
  tierIds: [],
  enableComments: true,
  tags: [],
  isDrop: false,
  scheduledDate: undefined,
  emailSubscribers: false,
};

export default function CreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePostFormData>(defaultFormData);
  const [isPublishing, setIsPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleFormChange = (updates: Partial<CreatePostFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleMediaTypeSelect = (type: MediaType) => {
    handleFormChange({ mediaType: type });
  };

  const handlePreview = () => {
    // Validate before preview
    const validation = validateCreatePost(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      alert("Please fix the errors before previewing");
      return;
    }

    // TODO: Implement preview functionality
    console.log("Preview post:", formData);
  };

  const handlePublish = async () => {
    // Validate form data
    const validation = validateCreatePost(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Show first error
      if (validation.errors.length > 0) {
        alert(validation.errors[0].message);
      }
      return;
    }

    setIsPublishing(true);

    try {
      // TODO: Implement actual publish logic with smart contract
      console.log("Publishing post:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success - redirect to creator dashboard or post page
      router.push("/creator/dashboard");
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Failed to publish post. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AdaptiveLayout>
      <div className="flex min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Media Type Buttons */}
            <MediaTypeSelector
              selectedType={formData.mediaType}
              onTypeSelect={handleMediaTypeSelect}
            />

            {/* Title Input */}
            <div>
              <Input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => handleFormChange({ title: e.target.value })}
                className="text-3xl font-bold border-none bg-transparent px-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {validationErrors.find((e) => e.field === "title") && (
                <p className="mt-2 text-sm text-destructive">
                  {validationErrors.find((e) => e.field === "title")?.message}
                </p>
              )}
            </div>

            {/* Rich Text Editor */}
            <div>
              <Textarea
                placeholder="Start writing..."
                value={formData.content}
                onChange={(e) => handleFormChange({ content: e.target.value })}
                className="min-h-[400px] resize-none border-none bg-transparent px-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {validationErrors.find((e) => e.field === "content") && (
                <p className="mt-2 text-sm text-destructive">
                  {validationErrors.find((e) => e.field === "content")?.message}
                </p>
              )}
            </div>

            {/* Newsletter Template Section */}
            <div className="mt-12 rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Start creating a...</h3>
              <button
                type="button"
                className="flex w-full items-start gap-4 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Newsletter</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    E.g. Weekly updates, journal entries, exclusive deep dives
                  </p>
                </div>
              </button>
            </div>
          </div>
        </main>

        {/* Settings Sidebar */}
        <SettingsSidebar
          formData={formData}
          onFormChange={handleFormChange}
          availableTiers={mockTiers}
          onPreview={handlePreview}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      </div>
    </AdaptiveLayout>
  );
}
