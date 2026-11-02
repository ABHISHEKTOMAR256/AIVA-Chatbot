"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Tag,
  MapPin,
  Lock,
  X,
  Filter,
  Sparkles,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import {
  getAllComplaints,
  updateComplaintStatus,
  createAdminComplaint,
  getAdminLostFound,
  createAdminLostFound,
  updateAdminLostFoundStatus,
} from "@/lib/api";
import type { Complaint, LostFoundItem } from "@/types";

export default function ManualOperationsPage() {
  const { isAdmin, isGuest, requireAuth } = useGuestAuth();

  const [activeTab, setActiveTab] = useState<"complaints" | "lost_found">("complaints");

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintFilter, setComplaintFilter] = useState("");
  const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
  const [newComplaintData, setNewComplaintData] = useState({
    title: "",
    category: "electricity",
    description: "",
    location: "Block B",
    room_number: "204",
    priority: "medium",
  });

  // Lost & Found state
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [isNewLostFoundOpen, setIsNewLostFoundOpen] = useState(false);
  const [newLostFoundData, setNewLostFoundData] = useState({
    item_type: "lost",
    title: "",
    description: "",
    category: "electronics",
    location: "Hostel Lobby",
  });

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [compRes, lfRes] = await Promise.allSettled([
          getAllComplaints({ status: complaintFilter || undefined }),
          getAdminLostFound(),
        ]);
        if (compRes.status === "fulfilled") {
          const val = compRes.value as any;
          setComplaints(Array.isArray(val) ? val : val?.complaints || []);
        }
        if (lfRes.status === "fulfilled") setLostFoundItems(lfRes.value || []);
      } else {
        // Guest Demo Data
        setComplaints([
          {
            id: "demo-c-1",
            user_id: "demo",
            reference_number: "CMP-2026-E102",
            category: "electricity",
            title: "Ceiling fan sparking in Room 302",
            description: "Sparks observed when switching on regulator. Urgent inspection requested.",
            status: "in_progress",
            priority: "high",
            location: "Block C",
            room_number: "302",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-c-2",
            user_id: "demo",
            reference_number: "CMP-2026-W044",
            category: "water_supply",
            title: "Water filter leakage on 2nd Floor",
            description: "Drinking water dispenser overflow.",
            status: "submitted",
            priority: "medium",
            location: "Block A",
            room_number: "2nd Floor Corridor",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        setLostFoundItems([
          {
            id: "demo-lf-1",
            user_id: "demo",
            item_type: "lost",
            title: "Boat Airdopes Earbuds Case",
            description: "Black charging case left near Study Room 2.",
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
            title: "Student ID Card & Room Key",
            description: "Handed over to hostel security desk.",
            category: "identity",
            location: "Hostel Gate 1",
            status: "returned",
            date_occurred: new Date().toISOString(),
            contact_preference: "chat",
            is_anonymous: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, complaintFilter]);

  // Handle Create Complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("Create hostel complaint manually")) return;

    try {
      await createAdminComplaint(newComplaintData);
      setIsNewComplaintOpen(false);
      setActionSuccess("Complaint created and ticket assigned successfully!");
      loadData();
    } catch (err: any) {
      alert("Error creating complaint: " + err.message);
    }
  };

  // Handle Update Status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!requireAuth(`Update ticket status to ${newStatus}`)) return;

    try {
      await updateComplaintStatus(id, { status: newStatus as any });
      setActionSuccess(`Ticket updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    }
  };

  // Handle Create Lost & Found
  const handleCreateLostFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("Register lost/found report")) return;

    try {
      await createAdminLostFound(newLostFoundData);
      setIsNewLostFoundOpen(false);
      setActionSuccess("Item cataloged in Lost & Found database!");
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Handle Return Item
  const handleMarkItemReturned = async (id: string) => {
    if (!requireAuth("Mark item as Returned to student")) return;

    try {
      await updateAdminLostFoundStatus(id, "returned");
      setActionSuccess("Item marked as returned and case closed!");
      loadData();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Manual Operations Hub
              {isGuest && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 font-medium">
                  Guest Mode
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Administrative manual execution: Hostel complaints, room repairs, and lost &amp; found resolution
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 glass-card p-1.5 rounded-full shadow-sm">
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === "complaints"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hostel Complaints
          </button>
          <button
            onClick={() => setActiveTab("lost_found")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === "lost_found"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lost &amp; Found Hub
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── TAB 1: HOSTEL COMPLAINTS ── */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={complaintFilter}
                onChange={(e) => setComplaintFilter(e.target.value)}
                className="glass-card text-slate-700 text-xs font-medium px-4 py-2.5 rounded-full outline-none shadow-sm cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (requireAuth("Create new hostel complaint")) {
                  setIsNewComplaintOpen(true);
                }
              }}
              className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Complaint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                      {c.reference_number || "CMP-2026"}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-3 py-1 rounded-full uppercase ${
                        c.priority === "high" || c.priority === "urgent"
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                          : "bg-blue-50 text-blue-700 border border-blue-200/60"
                      }`}
                    >
                      {c.priority} priority
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{c.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{c.description}</p>

                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {c.location || "Hostel Block"}, Room {c.room_number || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{c.category.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Status: <strong className="text-slate-800 uppercase font-semibold">{c.status}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {c.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(String(c.id), "resolved")}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 text-emerald-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        Resolve
                      </button>
                    )}
                    {c.status === "submitted" && (
                      <button
                        onClick={() => handleUpdateStatus(String(c.id), "in_progress")}
                        className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/70 text-blue-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      >
                        In Progress
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: LOST & FOUND HUB ── */}
      {activeTab === "lost_found" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (requireAuth("Register Lost or Found item")) {
                  setIsNewLostFoundOpen(true);
                }
              }}
              className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Catalog Lost/Found Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {lostFoundItems.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold px-3 py-1 rounded-full uppercase ${
                        item.item_type === "lost"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      }`}
                    >
                      {item.item_type} ITEM
                    </span>
                    <span className="text-xs font-medium text-slate-500 capitalize">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Location: {item.location}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Status: <strong className="text-slate-800 uppercase font-semibold">{item.status}</strong>
                  </span>

                  {item.status !== "returned" && (
                    <button
                      onClick={() => handleMarkItemReturned(String(item.id))}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 text-emerald-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Complaint Modal */}
      {isNewComplaintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-7 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/90">
            <button
              onClick={() => setIsNewComplaintOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-5">Log New Hostel Complaint</h3>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Issue Title</label>
                <input
                  type="text"
                  required
                  value={newComplaintData.title}
                  onChange={(e) => setNewComplaintData({ ...newComplaintData, title: e.target.value })}
                  placeholder="e.g. Broken study table chair"
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={newComplaintData.category}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, category: e.target.value })}
                    className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="electricity">Electricity</option>
                    <option value="water_supply">Water Supply</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="room_maintenance">Room Maintenance</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                  <select
                    value={newComplaintData.priority}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, priority: e.target.value })}
                    className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Block / Location</label>
                  <input
                    type="text"
                    required
                    value={newComplaintData.location}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, location: e.target.value })}
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newComplaintData.room_number}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, room_number: e.target.value })}
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newComplaintData.description}
                  onChange={(e) => setNewComplaintData({ ...newComplaintData, description: e.target.value })}
                  placeholder="Provide complete breakdown of the maintenance issue..."
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewComplaintOpen(false)}
                  className="px-5 py-2.5 rounded-full glass-card text-slate-600 text-xs font-semibold hover:text-slate-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-md"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Lost & Found Modal */}
      {isNewLostFoundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-7 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/90">
            <button
              onClick={() => setIsNewLostFoundOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-5">Catalog Lost / Found Item</h3>

            <form onSubmit={handleCreateLostFound} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Report Type</label>
                  <select
                    value={newLostFoundData.item_type}
                    onChange={(e) => setNewLostFoundData({ ...newLostFoundData, item_type: e.target.value })}
                    className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={newLostFoundData.category}
                    onChange={(e) => setNewLostFoundData({ ...newLostFoundData, category: e.target.value })}
                    className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="documents">Documents / ID Cards</option>
                    <option value="keys">Keys</option>
                    <option value="clothing">Clothing / Accessories</option>
                    <option value="books">Books / Stationery</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Item Title</label>
                <input
                  type="text"
                  required
                  value={newLostFoundData.title}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, title: e.target.value })}
                  placeholder="e.g. Titan Silver Wristwatch"
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Found / Lost Location</label>
                <input
                  type="text"
                  required
                  value={newLostFoundData.location}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, location: e.target.value })}
                  placeholder="e.g. 1st Floor Study Room, Mess Gate"
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newLostFoundData.description}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, description: e.target.value })}
                  placeholder="Describe unique markings, color, brand..."
                  className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewLostFoundOpen(false)}
                  className="px-5 py-2.5 rounded-full glass-card text-slate-600 text-xs font-semibold hover:text-slate-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
