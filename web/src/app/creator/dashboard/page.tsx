import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Upload, Users, DollarSign, Eye } from "lucide-react";

export default function CreatorDashboard() {
  // Mock stats - TODO: Replace with real blockchain data
  const stats = {
    totalSubscribers: 335,
    monthlyRevenue: 4250,
    totalViews: 15680,
    activeContent: 42,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your content and subscribers
              </p>
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalSubscribers}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="mt-2 text-3xl font-bold">{stats.monthlyRevenue} SUI</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalViews}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Content</p>
                  <p className="mt-2 text-3xl font-bold">{stats.activeContent}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/creator/content/new"
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Content</h3>
                  <p className="text-sm text-muted-foreground">Create new post</p>
                </div>
              </a>

              <a
                href="/creator/tiers"
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Tiers</h3>
                  <p className="text-sm text-muted-foreground">Edit subscription plans</p>
                </div>
              </a>

              <a
                href="/creator/profile"
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your information</p>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Content */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Content</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4 text-center text-sm text-muted-foreground">
                No content uploaded yet. Start by creating your first post!
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
