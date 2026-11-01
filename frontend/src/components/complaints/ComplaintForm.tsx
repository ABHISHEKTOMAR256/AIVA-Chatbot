"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { createComplaint, uploadMedia } from "@/lib/api";
import type { Complaint, ComplaintCategory } from "@/types";

interface ComplaintFormProps {
  onSuccess: (complaint: Complaint) => void;
  onCancel: () => void;
}

export function ComplaintForm({ onSuccess, onCancel }: ComplaintFormProps) {
  const [category, setCategory] = useState<ComplaintCategory>("electricity");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: "electricity", label: "Electricity (Fan, Light, Switch, Power)" },
    { value: "water_supply", label: "Water Supply (No Water, Hot Water, Filter)" },
    { value: "wifi", label: "Wi-Fi & Internet Connectivity" },
    { value: "room_maintenance", label: "Room Maintenance (Door, Window, Bed, Cupboard)" },
    { value: "cleaning", label: "Cleaning & Housekeeping (Corridor, Dustbin, Room)" },
    { value: "plumbing", label: "Plumbing (Leaking Pipe, Tap, Washroom Flush)" },
    { value: "other", label: "Other General Hostel Issue" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create complaint record
      const complaint = await createComplaint({
        category,
        title,
        description,
        room_number: roomNumber || undefined,
        location: location || undefined,
        priority,
      });

      // Upload file if selected
      if (selectedFile) {
        try {
          await uploadMedia(selectedFile, complaint.id);
        } catch {
          // If image fails, complaint is still recorded
        }
      }

      onSuccess(complaint);
    } catch (err: any) {
      setError(err?.message || "Failed to create complaint");
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
          Issue Category *
        </label>
        <Select
          value={category}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as ComplaintCategory)}
          options={categories}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Complaint Title *
        </label>
        <Input
          placeholder="e.g. Washroom tap leaking continuously"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Room Number *
          </label>
          <Input
            placeholder="e.g. Room 304"
            value={roomNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Hostel Block / Location
          </label>
          <Input
            placeholder="e.g. Block A, 3rd Floor"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Detailed Description *
        </label>
        <textarea
          rows={3}
          placeholder="Describe the problem, when it started, and exact room details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Attach Photo (Optional)
        </label>
        <FileUpload
          onFileSelect={(file: File) => setSelectedFile(file)}
          onRemove={() => setSelectedFile(null)}
          accept="image/*"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting ? "Submitting..." : "Submit Complaint"}
        </Button>
      </div>
    </form>
  );
}
