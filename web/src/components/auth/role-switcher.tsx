"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { Button } from "@/components/ui/button";
import { UserCircle, Palette } from "lucide-react";
import { CreateProfileModal } from "@/components/creator/create-profile-modal";

export function RoleSwitcher() {
  const router = useRouter();
  const { currentRole, switchRole, isCreatorMode, user } = useUser();
  const { hasProfile, isLoading: isLoadingProfile } = useCreatorProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleRoleSwitch = (role: "fan" | "creator") => {
    // If switching to creator mode and user is authenticated but has no profile
    if (role === "creator" && user && !hasProfile && !isLoadingProfile) {
      // Show profile creation modal
      setShowProfileModal(true);
      return;
    }

    // Switch role
    switchRole(role);

    // Redirect to appropriate homepage
    if (role === "creator") {
      router.push("/creator/dashboard");
    } else {
      router.push("/");
    }
  };

  const handleProfileCreated = () => {
    // After profile is created, switch to creator mode and redirect
    switchRole("creator");
    router.push("/creator/dashboard");
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 rounded-lg border border-border bg-card p-1">
        <Button
          variant={!isCreatorMode ? "default" : "ghost"}
          size="sm"
          onClick={() => handleRoleSwitch("fan")}
          className="h-8 px-2 sm:px-3"
        >
          <UserCircle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Fan</span>
        </Button>
        <Button
          variant={isCreatorMode ? "default" : "ghost"}
          size="sm"
          onClick={() => handleRoleSwitch("creator")}
          className="h-8 px-2 sm:px-3"
          disabled={isLoadingProfile}
        >
          <Palette className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Creator</span>
        </Button>
      </div>

      {/* Profile Creation Modal */}
      <CreateProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onSuccess={handleProfileCreated}
      />
    </>
  );
}
