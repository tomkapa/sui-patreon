"use client";

/**
 * Toast Demo Page
 * Demonstrates all toast notification variants
 */

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

export default function ToastDemoPage() {
  const handleSuccess = () => {
    toast.success("Profile updated successfully!", {
      description: "Your changes have been saved to the blockchain.",
      duration: 5000,
    });
  };

  const handleError = () => {
    toast.error("Transaction failed", {
      description: "Insufficient funds to complete the transaction.",
      duration: 7000,
    });
  };

  const handleInfo = () => {
    toast.info("New content available", {
      description: "Check out the latest posts from creators you follow.",
      duration: 4000,
    });
  };

  const handleWarning = () => {
    toast.warning("Wallet connection required", {
      description: "Please connect your wallet to continue.",
      duration: 5000,
    });
  };

  const handleLoading = () => {
    const loadingToastId = toast.loading("Uploading to Walrus...", {
      description: "Please wait while we upload your content.",
    });

    // Simulate upload completion
    setTimeout(() => {
      toast.dismiss(loadingToastId);
      toast.success("Upload complete!", {
        description: "Your content is now available on Walrus.",
      });
    }, 3000);
  };

  const handleTransaction = () => {
    // Simulate a real transaction
    const mockDigest =
      "9vKMfHQrjKXz8YqT3pPnL1WmR4sN5bU6cX7dE8fG9hJ0";

    toast.transaction("Transaction sent to Sui", mockDigest, {
      duration: 5000,
    });

    // Simulate transaction completion
    setTimeout(() => {
      toast.success("Transaction confirmed!", {
        description: "Your subscription is now active.",
        duration: 5000,
      });
    }, 3000);
  };

  const handlePromise = async () => {
    const myPromise = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail
        if (Math.random() > 0.5) {
          resolve("Operation completed successfully");
        } else {
          reject(new Error("Operation failed"));
        }
      }, 2000);
    });

    toast.promise(myPromise, {
      loading: "Processing your request...",
      success: (data) => data,
      error: (err) => err.message,
    });
  };

  const handleMultiple = () => {
    toast.info("Step 1: Validating transaction...", { duration: 1500 });
    setTimeout(() => {
      toast.info("Step 2: Signing transaction...", { duration: 1500 });
    }, 1000);
    setTimeout(() => {
      toast.info("Step 3: Broadcasting to network...", { duration: 1500 });
    }, 2000);
    setTimeout(() => {
      toast.success("Transaction complete!", { duration: 3000 });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Toast Notifications Demo</h1>
          <p className="text-muted-foreground">
            Beautiful toast notifications styled to match the application theme
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">Toast Variants</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Success Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Success Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Shows confirmation messages for successful actions
              </p>
              <Button onClick={handleSuccess} className="w-full">
                Show Success
              </Button>
            </div>

            {/* Error Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <XCircle className="h-5 w-5 text-red-500" />
                Error Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Displays error messages when operations fail
              </p>
              <Button onClick={handleError} variant="destructive" className="w-full">
                Show Error
              </Button>
            </div>

            {/* Info Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <Info className="h-5 w-5 text-blue-500" />
                Info Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Shows informational messages and updates
              </p>
              <Button onClick={handleInfo} variant="outline" className="w-full">
                Show Info
              </Button>
            </div>

            {/* Warning Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Warning Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Alerts users about important warnings
              </p>
              <Button onClick={handleWarning} variant="outline" className="w-full">
                Show Warning
              </Button>
            </div>

            {/* Loading Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Indicates ongoing operations with spinner
              </p>
              <Button onClick={handleLoading} variant="outline" className="w-full">
                Show Loading
              </Button>
            </div>

            {/* Transaction Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <Info className="h-5 w-5 text-blue-500" />
                Transaction Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Shows transaction details with explorer link
              </p>
              <Button onClick={handleTransaction} className="w-full">
                Show Transaction
              </Button>
            </div>

            {/* Promise Toast */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <Loader2 className="h-5 w-5 text-primary" />
                Promise Toast
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatically handles async operations
              </p>
              <Button onClick={handlePromise} variant="outline" className="w-full">
                Show Promise
              </Button>
            </div>

            {/* Multiple Toasts */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-medium">
                <Info className="h-5 w-5 text-blue-500" />
                Multiple Toasts
              </h3>
              <p className="text-sm text-muted-foreground">
                Shows a sequence of toast notifications
              </p>
              <Button onClick={handleMultiple} variant="outline" className="w-full">
                Show Multiple
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Features</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Theme-matched colors:</strong> Uses app's primary color
                (#ff424d) and design tokens
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Custom icons:</strong> Lucide icons for each toast type
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Smooth animations:</strong> Slide-in/out with custom timing
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Dark theme support:</strong> Looks great in dark mode
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Action buttons:</strong> Primary color with hover effects
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>
                <strong>Close button:</strong> Styled to match the theme
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
