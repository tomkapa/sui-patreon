import { LibraryPost } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface LibraryResponse {
  posts: LibraryPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LibraryQueryParams {
  tab?: "posts" | "drafts" | "collections";
  search?: string;
  filter?: string;
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Fetch library posts for a creator
 */
export async function fetchLibraryPosts(
  creatorAddress: string,
  params: LibraryQueryParams = {}
): Promise<LibraryResponse> {
  const queryParams = new URLSearchParams();

  if (params.tab) queryParams.append("tab", params.tab);
  if (params.search) queryParams.append("search", params.search);
  if (params.filter) queryParams.append("filter", params.filter);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  const url = `${API_BASE_URL}/api/library/${creatorAddress}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Don't cache in development
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Creator not found");
    }
    throw new Error(`Failed to fetch library posts: ${response.statusText}`);
  }

  const data = await response.json();

  // Convert date strings back to Date objects
  return {
    posts: data.posts.map((post: any) => ({
      ...post,
      publishDate: new Date(post.publishDate),
    })),
    pagination: data.pagination,
  };
}
