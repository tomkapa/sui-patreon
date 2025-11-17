"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface FormData {
  name: string;
  description: string;
  price: string;
  benefits: string[];
}

/**
 * Subscription tier creation form
 * TODO: Integrate with Move smart contract when ready (Task #2)
 */
export function CreateTierForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    benefits: [""],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out empty benefits
      const benefits = formData.benefits.filter((b) => b.trim() !== "");

      // TODO: Call smart contract
      // const tx = new TransactionBlock();
      // tx.moveCall({
      //   target: `${PACKAGE_ID}::subscription::create_tier`,
      //   arguments: [
      //     tx.pure(formData.name),
      //     tx.pure(formData.description),
      //     tx.pure(parseFloat(formData.price) * 1_000_000_000), // Convert SUI to MIST
      //     tx.pure(benefits),
      //   ],
      // });
      // await signAndExecuteTransactionBlock({ transactionBlock: tx });

      console.log("Creating tier:", { ...formData, benefits });

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("Tier creation pending smart contract integration (Task #2)");
    } catch (error) {
      console.error("Tier creation error:", error);
      alert("Error creating tier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData((prev) => ({ ...prev, benefits: newBenefits }));
  };

  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Tier Name *
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Bronze Supporter"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe what subscribers get..."
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label htmlFor="price" className="mb-2 block text-sm font-medium">
          Price (SUI per month) *
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          placeholder="5.00"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Benefits *</label>
        <div className="space-y-2">
          {formData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={benefit}
                onChange={(e) => handleBenefitChange(index, e.target.value)}
                placeholder="Enter a benefit..."
                required
              />
              {formData.benefits.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBenefit(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBenefit}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Tier..." : "Create Tier"}
      </Button>
    </form>
  );
}
