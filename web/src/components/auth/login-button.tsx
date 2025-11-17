"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

/**
 * Login button with zkLogin integration
 * TODO: Integrate actual zkLogin flow when Task #15 is complete
 */
export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement zkLogin flow
      // 1. Generate ephemeral keypair
      // 2. Create nonce
      // 3. Redirect to OAuth provider (Google, etc.)
      // 4. Handle callback and generate ZK proof
      // 5. Derive Sui address from OAuth ID

      console.log("Login clicked - zkLogin integration pending");

      // Mock login for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show temporary message
      alert("zkLogin integration coming soon! (Task #15)");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Connecting...
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Log in with Google
        </>
      )}
    </Button>
  );
}
