"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { UserCircle, Palette } from "lucide-react";

export function RoleSwitcher() {
  const router = useRouter();
  const { currentRole, switchRole, isCreatorMode } = useUser();

  const handleRoleSwitch = (role: "fan" | "creator") => {
    switchRole(role);

    // Redirect to appropriate homepage
    if (role === "creator") {
      router.push("/creator/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
      <Button
        variant={!isCreatorMode ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleSwitch("fan")}
        className="h-8"
      >
        <UserCircle className="mr-2 h-4 w-4" />
        Fan
      </Button>
      <Button
        variant={isCreatorMode ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleSwitch("creator")}
        className="h-8"
      >
        <Palette className="mr-2 h-4 w-4" />
        Creator
      </Button>
    </div>
  );
}
