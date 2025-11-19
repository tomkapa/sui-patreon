"use client";

import { useState, useEffect } from "react";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { LibraryPost, LibraryTab } from "@/types";
import { fetchLibraryPosts, LibraryResponse } from "@/services/library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Info,
  Loader2,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

const getPostTypeIcon = (type: LibraryPost["postType"]) => {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getPostTypeLabel = (type: LibraryPost["postType"]) => {
  switch (type) {
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "image":
      return "Image";
    default:
      return "Text";
  }
};

// Mock wallet address for development (same as dashboard)
const MOCK_WALLET_ADDRESS =
  "0x1abec7f223edeb5120fab9c0cc133db6167145937fd1261777e5eeab0e87f966";

export default function LibraryPage() {
  const currentAccount = useCurrentAccount();
  const creatorAddress = currentAccount?.address || MOCK_WALLET_ADDRESS;

  const [activeTab, setActiveTab] = useState<LibraryTab>("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("");
  const postsPerPage = 20;

  // API state
  const [posts, setPosts] = useState<LibraryPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch posts from API
  useEffect(() => {
    // Fetch from API
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchLibraryPosts(creatorAddress, {
          tab: activeTab,
          search: searchQuery || undefined,
          filter: filterType || undefined,
          sortBy,
          sortOrder,
          page: currentPage,
          limit: postsPerPage,
        });

        setPosts(response.posts);
        setPagination(response.pagination);
      } catch (err) {
        console.error("Failed to fetch library posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
        // Clear posts on error
        setPosts([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [creatorAddress, activeTab, searchQuery, filterType, sortBy, sortOrder, currentPage]);

  // Display posts (either from API or filtered mock data)
  const displayPosts = posts;
  const totalPages = pagination.totalPages;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(new Set(displayPosts.map((p) => p.id)));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    const newSelected = new Set(selectedPosts);
    if (checked) {
      newSelected.add(postId);
    } else {
      newSelected.delete(postId);
    }
    setSelectedPosts(newSelected);
  };

  const toggleSort = (column: "date" | "title") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <AdaptiveLayout>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <h1 className="mb-8 text-4xl font-bold">Library</h1>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LibraryTab)}>
            <TabsList className="mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Filters and Search */}
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {filterType ? `Filter: ${filterType}` : "Filter"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setFilterType("")}>
                      All posts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("video")}>
                      Video posts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("audio")}>
                      Audio posts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("image")}>
                      Image posts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("text")}>
                      Text posts
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Posts Table */}
              {activeTab === "collections" ? (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground">
                      No collections yet
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create collections to organize your posts
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              displayPosts.length > 0 &&
                              displayPosts.every((p) => selectedPosts.has(p.id))
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>
                          <button
                            onClick={() => toggleSort("date")}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Publish date
                            {sortBy === "date" &&
                              (sortOrder === "desc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              ))}
                          </button>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Tier access
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Price
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableHead>
                        <TableHead>Post type</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin" />
                              <p className="text-sm">Loading posts...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : displayPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-64 text-center">
                            <div className="text-muted-foreground">
                              <p className="text-lg font-medium">No posts found</p>
                              <p className="mt-2 text-sm">
                                {activeTab === "drafts"
                                  ? "You don't have any drafts yet"
                                  : "Create your first post to get started"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedPosts.has(post.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectPost(post.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {post.thumbnailUrl && (
                                  <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                                      <span className="text-xs text-gray-600">IMG</span>
                                    </div>
                                  </div>
                                )}
                                {post.title}
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.publishDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>{post.tierAccess}</TableCell>
                            <TableCell>
                              {post.price ? (
                                `${post.price} SUI`
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  Ineligible
                                  <Info className="h-3 w-3" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPostTypeIcon(post.postType)}
                                {getPostTypeLabel(post.postType)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View analytics</DropdownMenuItem>
                                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && displayPosts.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev || currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!pagination.hasNext || currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdaptiveLayout>
  );
}
