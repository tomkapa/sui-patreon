import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MessageSquare } from "lucide-react";

export default function ChatsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Messages Coming Soon</h2>
            <p className="text-muted-foreground">
              Direct messaging between creators and subscribers will be available soon.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              TODO: Implement messaging system (Task #5)
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
