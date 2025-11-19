"use client";

/**
 * Tier Management Component
 *
 * Allows creators to manage their subscription tiers:
 * - View list of existing tiers (active and inactive)
 * - Create new tiers
 * - Deactivate active tiers
 *
 * Integrates with:
 * - Backend API for tier data
 * - Sui blockchain for tier creation/deactivation
 * - Form validation with React Hook Form + Zod
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useCreatorTiers } from "@/hooks/useCreatorTiers";
import { useCreateTier } from "@/hooks/useCreateTier";
import { useDeactivateTier } from "@/hooks/useDeactivateTier";
import { smallestUnitToUsdc } from "@/lib/sui/constants";
import {
  createTierFormSchema,
  type CreateTierFormData,
} from "@/lib/schemas/create-tier-schema";

export function TierManagement() {
  const { tiers, isLoading: isTiersLoading, refetch } = useCreatorTiers(true);
  const { createTier, isLoading: isCreating } = useCreateTier();
  const { deactivateTier, isLoading: isDeactivating } = useDeactivateTier();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deactivatingTierId, setDeactivatingTierId] = useState<string | null>(null);
  const [confirmDeactivateTierId, setConfirmDeactivateTierId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTierFormData>({
    resolver: zodResolver(createTierFormSchema),
    defaultValues: {
      name: "",
      description: "",
      monthlyPrice: undefined,
    },
  });

  const isLoading = isCreating || isDeactivating;

  // Handle tier creation form submission
  const onCreateTier = async (data: CreateTierFormData) => {
    try {
      await createTier({
        ...data,
        onSuccess: () => {
          // Refetch tiers after 3-second delay (handled in hook)
          refetch();
        },
      });

      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      reset();
    } catch (error) {
      console.error("Failed to create tier:", error);
      // Error toast is handled by useTransaction hook
    }
  };

  // Handle tier deactivation
  const handleDeactivate = async (tierId: string) => {
    try {
      setDeactivatingTierId(tierId);
      await deactivateTier({
        tierId,
        onSuccess: () => {
          // Refetch tiers after 3-second delay (handled in hook)
          refetch();
        },
      });

      // Close confirmation dialog
      setConfirmDeactivateTierId(null);
    } catch (error) {
      console.error("Failed to deactivate tier:", error);
      // Error toast is handled by useTransaction hook
    } finally {
      setDeactivatingTierId(null);
    }
  };

  // Format price for display
  const formatPrice = (priceStr: string): string => {
    const price = BigInt(priceStr);
    const usdc = smallestUnitToUsdc(price);
    return usdc.toFixed(2);
  };

  // Show loading state
  if (isTiersLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Subscription Tiers</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subscription Tiers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription tiers and pricing.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tier
        </Button>
      </div>

      {/* Tier List */}
      {tiers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <p className="text-muted-foreground">
            No tiers created yet. Create your first tier to start accepting subscribers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tier.description}
                    </CardDescription>
                  </div>
                  <Badge variant={tier.isActive ? "success" : "secondary"}>
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">
                      {formatPrice(tier.price)} USDC/month
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subscribers:</span>
                    <span className="font-semibold">{tier.subscriberCount}</span>
                  </div>
                </div>
              </CardContent>
              {tier.isActive && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setConfirmDeactivateTierId(tier.tierId)}
                    disabled={isLoading}
                  >
                    {deactivatingTierId === tier.tierId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deactivating...
                      </>
                    ) : (
                      "Deactivate"
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Tier Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tier</DialogTitle>
            <DialogDescription>
              Add a new subscription tier for your supporters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onCreateTier)} className="space-y-4">
            {/* Tier Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Premium, VIP, Basic"
                disabled={isLoading}
                maxLength={50}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe what subscribers get with this tier..."
                rows={3}
                disabled={isLoading}
                maxLength={500}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Monthly Price */}
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">
                Monthly Price (USDC) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monthlyPrice"
                type="number"
                step="0.01"
                min="0.01"
                {...register("monthlyPrice", { valueAsNumber: true })}
                placeholder="10.00"
                disabled={isLoading}
              />
              {errors.monthlyPrice && (
                <p className="text-sm text-red-500">{errors.monthlyPrice.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  reset();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Tier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={confirmDeactivateTierId !== null}
        onOpenChange={(open) => !open && setConfirmDeactivateTierId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Tier</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this tier? Existing subscribers will
              keep their access, but new subscriptions won&apos;t be allowed.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. You will need to create a new tier if you
              want to re-enable this pricing.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeactivateTierId(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeactivateTierId) {
                  handleDeactivate(confirmDeactivateTierId);
                }
              }}
              disabled={isLoading}
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate Tier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
