"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface FormData {
  title: string;
  description: string;
  contentType: "video" | "audio" | "image" | "text";
  file: File | null;
  isPublic: boolean;
  tierIds: string[];
}

/**
 * Content upload form with Walrus and Seal integration
 * TODO: Integrate with Walrus storage (Task #3) and Seal encryption (Task #4)
 */
export function UploadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    contentType: "image",
    file: null,
    isPublic: false,
    tierIds: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.file) {
        alert("Please select a file to upload");
        return;
      }

      // TODO: Upload to Walrus
      // const arrayBuffer = await formData.file.arrayBuffer();
      // const data = new Uint8Array(arrayBuffer);
      // const { blobId } = await walrusClient.writeBlob({
      //   blob: data,
      //   epochs: 100,
      //   deletable: true,
      // });

      // TODO: If not public, encrypt with Seal
      // if (!formData.isPublic) {
      //   const encrypted = await seal.encrypt(data, { policyId });
      //   // Upload encrypted data instead
      // }

      // TODO: Create content record on-chain
      // const tx = new TransactionBlock();
      // tx.moveCall({
      //   target: `${PACKAGE_ID}::content::create_content`,
      //   arguments: [
      //     tx.pure(formData.title),
      //     tx.pure(formData.description),
      //     tx.pure(blobId),
      //     tx.pure(formData.tierIds),
      //     tx.pure(formData.isPublic),
      //   ],
      // });
      // await signAndExecuteTransactionBlock({ transactionBlock: tx });

      console.log("Uploading content:", formData);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Content upload pending Walrus/Seal integration (Tasks #3, #4)");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          Title *
        </label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Give your content a title"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your content..."
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label htmlFor="contentType" className="mb-2 block text-sm font-medium">
          Content Type *
        </label>
        <select
          id="contentType"
          name="contentType"
          value={formData.contentType}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="text">Text</option>
        </select>
      </div>

      <div>
        <label htmlFor="file" className="mb-2 block text-sm font-medium">
          File *
        </label>
        <div className="flex items-center gap-4">
          <label
            htmlFor="file"
            className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            Choose File
          </label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            required
          />
          {formData.file && (
            <span className="text-sm text-muted-foreground">{formData.file.name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isPublic"
          name="isPublic"
          type="checkbox"
          checked={formData.isPublic}
          onChange={handleChange}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="isPublic" className="text-sm font-medium">
          Make this content public (visible to everyone)
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Uploading..." : "Upload Content"}
      </Button>
    </form>
  );
}
