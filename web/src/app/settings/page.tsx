import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { AccountSettings } from "@/components/settings/account-settings";
import { TierManagement } from "@/components/settings/tier-management";

export default function SettingsPage() {
  return (
    <AdaptiveLayout>
      <main className="p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-3xl font-bold">Settings</h1>

            <div className="space-y-6">
              {/* Account Settings */}
              <AccountSettings />

              {/* Subscription Tiers */}
              <TierManagement />
            </div>
          </div>
      </main>
    </AdaptiveLayout>
  );
}
