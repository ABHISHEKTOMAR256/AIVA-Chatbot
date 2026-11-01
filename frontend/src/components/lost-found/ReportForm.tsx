"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createLostFound } from "@/lib/api";
import type { LostFoundItem } from "@/types";

interface ReportFormProps {
  onSuccess: (item: LostFoundItem) => void;
  onCancel: () => void;
}

export function ReportForm({ onSuccess, onCancel }: ReportFormProps) {
  const [itemType, setItemType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("electronics");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split("T")[0]);
  const [contactPreference, setContactPreference] = useState<"email" | "phone" | "chat">("chat");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: "electronics", label: "Electronics (Laptop, Phone, Charger, Headphones)" },
    { value: "clothing", label: "Clothing & Footwear" },
    { value: "documents", label: "IDs, Wallets & Documents" },
    { value: "accessories", label: "Watches, Glasses & Accessories" },
    { value: "books", label: "Books & Study Material" },
    { value: "other", label: "Other Items" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please fill in title, description, and location.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const item = await createLostFound({
        item_type: itemType,
        title,
        description,
        location,
        date_occurred: dateOccurred,
        category,
        contact_preference: contactPreference,
        is_anonymous: isAnonymous,
      });
      onSuccess(item);
    } catch (err: any) {
      setError(err?.message || "Failed to submit lost/found report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Report Type *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setItemType("lost")}
            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
              itemType === "lost"
                ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            I Lost an Item
          </button>
          <button
            type="button"
            onClick={() => setItemType("found")}
            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
              itemType === "found"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            I Found an Item
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Item Title *
        </label>
        <Input
          placeholder="e.g. Blue Boat Rockerz Earphones"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Category *
          </label>
          <Select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            options={categories}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Date *
          </label>
          <Input
            type="date"
            value={dateOccurred}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateOccurred(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Location Where Lost / Found *
        </label>
        <Input
          placeholder="e.g. Block B Mess 2nd Floor, Table near window"
          value={location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Item Description & Identifying Marks *
        </label>
        <textarea
          rows={3}
          placeholder="Include color, brand, condition, or unique stickers..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="anon"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
        />
        <label htmlFor="anon" className="text-xs text-gray-600">
          Post anonymously (your name will not be shown on the public board)
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
