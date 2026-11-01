"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/lost-found/ItemCard";
import { ReportForm } from "@/components/lost-found/ReportForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { searchLostFound } from "@/lib/api";
import { Plus, Search, Filter } from "lucide-react";
import type { LostFoundItem } from "@/types";

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await searchLostFound({
        query: searchQuery || undefined,
        item_type: typeFilter === "all" ? undefined : typeFilter,
      });
      setItems(data);
    } catch (err) {
      console.error("Failed to load lost/found items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [typeFilter, searchQuery]);

  const handleCreated = (newItem: LostFoundItem) => {
    setItems((prev) => [newItem, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Lost & Found Desk
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Search reported hostel items or submit reports for misplaced belongings.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-semibold px-4 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Report Lost / Found Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, color, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["all", "lost", "found"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors flex-1 sm:flex-initial ${
                typeFilter === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "All Items" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-gray-800 text-sm">No items found</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            No lost or found items matched your search criteria.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Submit a Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Misplaced Item"
      >
        <ReportForm
          onSuccess={handleCreated}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
