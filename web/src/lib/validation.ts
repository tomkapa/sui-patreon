import { CreatePostFormData } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate create post form data
 */
export function validateCreatePost(formData: CreatePostFormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Title validation
  if (!formData.title.trim()) {
    errors.push({
      field: "title",
      message: "Title is required",
    });
  } else if (formData.title.length > 200) {
    errors.push({
      field: "title",
      message: "Title must be less than 200 characters",
    });
  }

  // Content validation
  if (!formData.content.trim()) {
    errors.push({
      field: "content",
      message: "Content is required",
    });
  } else if (formData.content.length > 50000) {
    errors.push({
      field: "content",
      message: "Content is too long (max 50,000 characters)",
    });
  }

  // Audience validation
  if (formData.audience === "paid" && formData.tierIds.length === 0) {
    errors.push({
      field: "tierIds",
      message: "Please select at least one tier for paid access",
    });
  }

  // Scheduled date validation
  if (formData.scheduledDate) {
    const now = new Date();
    if (formData.scheduledDate <= now) {
      errors.push({
        field: "scheduledDate",
        message: "Scheduled date must be in the future",
      });
    }
  }

  // Tags validation
  if (formData.tags.length > 10) {
    errors.push({
      field: "tags",
      message: "Maximum 10 tags allowed",
    });
  }

  formData.tags.forEach((tag) => {
    if (tag.length > 50) {
      errors.push({
        field: "tags",
        message: `Tag "${tag}" is too long (max 50 characters)`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
