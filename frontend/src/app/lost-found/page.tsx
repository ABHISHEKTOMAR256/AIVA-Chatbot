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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-white/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Lost &amp; Found Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Search reported hostel items or submit reports for misplaced belongings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-luminous-primary rounded-full text-xs font-semibold px-5 py-2.5 flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report Lost / Found Item</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 glass-card rounded-3xl border border-white/80 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items by name, color, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 glass-input rounded-full outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(["all", "lost", "found"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                typeFilter === t
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-sm"
                  : "glass-card text-slate-600 hover:text-slate-900"
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
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-white/80 shadow-sm space-y-2">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-slate-800 text-sm">No items found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 font-medium">
            No lost or found items matched your search criteria.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Submit a Report</span>
          </button>
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
