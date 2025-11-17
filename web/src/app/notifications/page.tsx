import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <Bell className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-semibold">No Notifications Yet</h2>
            <p className="text-muted-foreground">
              You'll see notifications here when creators you follow post new content.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              TODO: Implement notification system
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
