"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import { RoleSwitcher } from "@/components/auth/role-switcher";

export function Header() {
  // TODO: Check if user is authenticated via zkLogin
  const isAuthenticated = false;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators..."
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Role Switcher */}
          <RoleSwitcher />

          {isAuthenticated ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/creator/dashboard">Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/creator/content/new">Create</Link>
              </Button>
            </>
          ) : (
            <>
              <LoginButton />
              <Button variant="outline" asChild>
                <Link href="/creator/dashboard">Become a Creator</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
