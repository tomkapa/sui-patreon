import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-3xl font-bold">Settings</h1>

            <div className="space-y-6">
              {/* Account Settings */}
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and preferences.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  TODO: Implement account settings
                </p>
              </section>

              {/* Wallet Settings */}
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Wallet</h2>
                <p className="text-sm text-muted-foreground">
                  Connect and manage your Sui wallet.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  TODO: Integrate wallet connection (zkLogin - Task #15)
                </p>
              </section>

              {/* Notification Preferences */}
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Control how you receive notifications.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  TODO: Implement notification preferences
                </p>
              </section>

              {/* Privacy Settings */}
              <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Privacy</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your privacy and data settings.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  TODO: Implement privacy settings
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
