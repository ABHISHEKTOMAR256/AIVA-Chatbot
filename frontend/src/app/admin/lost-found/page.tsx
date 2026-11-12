"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Tag,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Box,
  Eye,
} from "lucide-react";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import {
  getAdminLostFound,
  createAdminLostFound,
  updateAdminLostFoundStatus,
  uploadMedia,
  getMediaUrl,
} from "@/lib/api";
import type { LostFoundItem } from "@/types";

export default function AdminLostFoundPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeItemPreview, setActiveItemPreview] = useState<LostFoundItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    item_type: "found" as "found" | "lost",
    title: "",
    category: "electronics",
    location: "Hostel Study Room 2",
    description: "",
    date_occurred: new Date().toISOString().split("T")[0],
    contact_preference: "chat" as "phone" | "email" | "chat",
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await getAdminLostFound({
          query: search || undefined,
          item_type: typeFilter || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
        });
        setItems(data || []);
      } else {
        // Demonstration preview items for Guest Mode
        setItems([
          {
            id: "demo-lf-1",
            user_id: "demo",
            item_type: "found",
            title: "Boat Airdopes Earbuds (Black)",
            description: "Black case found on table 4 with USB-C cable. Kept at warden desk.",
            category: "electronics",
            location: "Central Library 1st Floor",
            status: "open",
            date_occurred: new Date().toISOString(),
            contact_preference: "chat",
            is_anonymous: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-lf-2",
            user_id: "demo",
            item_type: "found",
            title: "Titan Neo Silver Wristwatch",
            description: "Metallic analog wristwatch found near badminton court washrooms.",
            category: "accessories",
            location: "Sports Complex Court 2",
            status: "open",
            date_occurred: new Date().toISOString(),
            contact_preference: "phone",
            is_anonymous: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-lf-3",
            user_id: "demo",
            item_type: "lost",
            title: "Blue HP Laptop Charger (65W)",
            description: "Left during evening study session. Has a red electrical tape on cord.",
            category: "electronics",
            location: "Block B Study Room",
            status: "open",
            date_occurred: new Date().toISOString(),
            contact_preference: "chat",
            is_anonymous: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-lf-4",
            user_id: "demo",
            item_type: "found",
            title: "Room 304 Keys with Yellow Keychain",
            description: "Set of 2 keys found in Mess counter. Handed to security guard.",
            category: "keys",
            location: "Hostel Mess Hall",
            status: "returned",
            date_occurred: new Date().toISOString(),
            contact_preference: "phone",
            is_anonymous: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading lost & found items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [isAdmin, typeFilter, categoryFilter, statusFilter]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleCreateFoundItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("Upload and catalog found objects")) return;

    setSubmitting(true);
    try {
      // 1. Create Lost/Found record
      const createdItem = await createAdminLostFound(formData);

      // 2. Upload photo if selected
      if (selectedPhoto && createdItem?.id) {
        try {
          await uploadMedia(selectedPhoto, undefined, String(createdItem.id));
        } catch (mediaErr) {
          console.warn("Photo upload warning:", mediaErr);
        }
      }

      setActionSuccess(`Successfully cataloged "${formData.title}" in Lost & Found registry!`);
      setIsOpen(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setFormData({
        item_type: "found",
        title: "",
        category: "electronics",
        location: "Hostel Study Room 2",
        description: "",
        date_occurred: new Date().toISOString().split("T")[0],
        contact_preference: "chat" as const,
      });
      loadItems();
    } catch (err: any) {
      alert("Failed to catalog object: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    if (!requireAuth("Update item resolution status")) return;
    try {
      await updateAdminLostFoundStatus(itemId, newStatus);
      setActionSuccess(`Item status updated to ${newStatus.toUpperCase()}`);
      loadItems();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const foundCount = items.filter((i) => i.item_type === "found" && i.status !== "returned").length;
  const lostCount = items.filter((i) => i.item_type === "lost").length;
  const resolvedCount = items.filter((i) => i.status === "returned" || i.status === "claimed").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-white/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full border border-blue-500/20">
              Campus Asset Recovery
            </span>
            <span className="text-xs font-semibold text-slate-400">• Telegram Sync Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lost &amp; Found Management Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Upload found objects with photographic evidence. Items instantly sync to Telegram bot queries (<code>/lost</code>) and student portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadItems}
            className="p-2.5 rounded-full glass-card hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() => {
              if (requireAuth("Upload and catalog found objects")) {
                setIsOpen(true);
              }
            }}
            className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Catalog Found Object</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3D Pedestal Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Cataloged</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">{items.length}</span>
            <span className="text-[10px] font-semibold text-blue-600">items</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex flex-col justify-between border-b-2 border-emerald-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Found In Storage</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-700">{foundCount}</span>
            <span className="text-[10px] font-semibold text-emerald-600">unclaimed</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex flex-col justify-between border-b-2 border-amber-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Reported Lost</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-700">{lostCount}</span>
            <span className="text-[10px] font-semibold text-amber-600">pending</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex flex-col justify-between border-b-2 border-cyan-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Returned to Owner</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-cyan-700">{resolvedCount}</span>
            <span className="text-[10px] font-semibold text-cyan-600">success rate</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-card rounded-3xl">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadItems()}
            placeholder="Search by keyword, location, or item name..."
            className="w-full glass-input rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="glass-card text-slate-700 text-xs font-semibold px-4 py-2 rounded-full outline-none shadow-sm cursor-pointer"
          >
            <option value="">All Report Types</option>
            <option value="found">Found Objects</option>
            <option value="lost">Reported Lost</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-card text-slate-700 text-xs font-semibold px-4 py-2 rounded-full outline-none shadow-sm cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="keys">Keys &amp; Locks</option>
            <option value="wallet">Wallets &amp; Cards</option>
            <option value="clothing">Clothing &amp; Bags</option>
            <option value="documents">ID &amp; Documents</option>
            <option value="books">Books &amp; Notes</option>
            <option value="other">Other Assets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-card text-slate-700 text-xs font-semibold px-4 py-2 rounded-full outline-none shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="open">Open / Unclaimed</option>
            <option value="returned">Returned / Handed Over</option>
          </select>
        </div>
      </div>

      {/* Grid of Cataloged Items */}
      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-blue-600 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          Loading Lost &amp; Found registry...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl">
          <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">No matching items cataloged in the registry.</p>
          <p className="text-[11px] text-slate-400 mt-1">Click "+ Catalog Found Object" above to register an item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isFound = item.item_type === "found";
            const isResolved = item.status === "returned" || item.status === "claimed";

            return (
              <div
                key={item.id}
                className="group p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                        isFound
                          ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                      }`}
                    >
                      {isFound ? "🟢 FOUND OBJECT" : "🔴 REPORTED LOST"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 capitalize bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{item.location || "Hostel Campus"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(item.created_at || item.date_occurred).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      isResolved
                        ? "bg-slate-100 text-slate-600"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {isResolved ? "Returned" : "In Custody"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveItemPreview(item)}
                      className="p-2 rounded-full glass-card hover:bg-white text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-sm"
                      title="Inspect Object Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {!isResolved && (
                      <button
                        onClick={() => handleUpdateStatus(String(item.id), "returned")}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Handed Over
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Catalog Found Object */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-white max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Catalog Found Object</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Register found item in the hostel custody database with optional photographic evidence.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFoundItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Record Type</label>
                  <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                    className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none font-semibold cursor-pointer"
                  >
                    <option value="found">🟢 Found Object (In Custody)</option>
                    <option value="lost">🔴 Reported Lost (Misplaced)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Asset Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none font-semibold cursor-pointer"
                  >
                    <option value="electronics">Electronics (Phones, Earbuds, Laptops)</option>
                    <option value="keys">Keys &amp; Locks</option>
                    <option value="wallet">Wallets &amp; ATM/ID Cards</option>
                    <option value="clothing">Bags, Jackets &amp; Apparel</option>
                    <option value="documents">Government / College IDs</option>
                    <option value="books">Books &amp; Stationery</option>
                    <option value="other">Other Personal Items</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Object Title / Label</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Boat Airdopes 141 Charging Case (Black)"
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Location Found / Recovered</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Mess Hall Table 14"
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Date Found</label>
                  <input
                    type="date"
                    required
                    value={formData.date_occurred}
                    onChange={(e) => setFormData({ ...formData, date_occurred: e.target.value })}
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Distinctive Features &amp; Details</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide identifiers: serial number, color, sticker, scratches, or condition..."
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none font-medium resize-none"
                />
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Object Photograph Evidence (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 transition-colors bg-white/40">
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="Selected preview" className="h-32 object-contain rounded-xl mx-auto border" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                      <span className="text-xs font-bold text-blue-600 hover:underline">Click to upload photo of found object</span>
                      <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, or WebP up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Claim Channel / Contact Preference</label>
                <select
                  value={formData.contact_preference}
                  onChange={(e) => setFormData({ ...formData, contact_preference: e.target.value as any })}
                  className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 outline-none font-semibold cursor-pointer"
                >
                  <option value="chat">In-App Live Chat &amp; Telegram Bot</option>
                  <option value="phone">Caretaker Telephone / Warden Desk</option>
                  <option value="email">Hostel Administration Email</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-full glass-card hover:bg-white text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-luminous-primary px-7 py-2.5 rounded-full text-xs font-bold cursor-pointer shadow-md flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "Publishing..." : "Publish to Directory & Telegram"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Inspector Modal */}
      {activeItemPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-white">
            <button
              onClick={() => setActiveItemPreview(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full border border-blue-200">
                {activeItemPreview.item_type}
              </span>
              <span className="text-xs font-semibold text-slate-400 capitalize">{activeItemPreview.category}</span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">{activeItemPreview.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">{activeItemPreview.description}</p>

            <div className="space-y-2 p-4 rounded-2xl bg-white/60 border border-slate-100 text-xs text-slate-600 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Location Found:</span>
                <span className="font-bold text-slate-800">{activeItemPreview.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Status:</span>
                <span className="font-bold uppercase text-blue-600">{activeItemPreview.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Claim Office:</span>
                <span className="font-bold text-slate-800">{activeItemPreview.contact_preference || "Hostel Office"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveItemPreview(null)}
                className="px-5 py-2.5 rounded-full glass-card hover:bg-white text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
