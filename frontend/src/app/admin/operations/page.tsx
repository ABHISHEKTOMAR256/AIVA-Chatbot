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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Manual Operations Hub
              {isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Guest Mode
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Administrative manual execution: Hostel complaints, room repairs, and lost & found resolution
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === "complaints"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Hostel Complaints
          </button>
          <button
            onClick={() => setActiveTab("lost_found")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === "lost_found"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Lost & Found Hub
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">
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
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono px-3 py-2 rounded-xl outline-none"
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Complaint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {c.reference_number || "CMP-2026"}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                        c.priority === "high" || c.priority === "urgent"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {c.priority} priority
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{c.description}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {c.location || "Hostel Block"}, Room {c.room_number || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{c.category.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    Status: <strong className="text-white uppercase">{c.status}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {c.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(String(c.id), "resolved")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    {c.status === "submitted" && (
                      <button
                        onClick={() => handleUpdateStatus(String(c.id), "in_progress")}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono transition-colors"
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catalog Lost/Found Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lostFoundItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0b0f19]/80 border border-cyan-500/20 backdrop-blur-xl flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                        item.item_type === "lost"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {item.item_type} ITEM
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.description}</p>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>Location: {item.location}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Status: <strong className="text-white uppercase">{item.status}</strong>
                  </span>

                  {item.status !== "returned" && (
                    <button
                      onClick={() => handleMarkItemReturned(String(item.id))}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setIsNewComplaintOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Log New Hostel Complaint</h3>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={newComplaintData.title}
                  onChange={(e) => setNewComplaintData({ ...newComplaintData, title: e.target.value })}
                  placeholder="e.g. Broken study table chair"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Category</label>
                  <select
                    value={newComplaintData.category}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                  <label className="text-xs font-mono text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newComplaintData.priority}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                  <label className="text-xs font-mono text-slate-400 block mb-1">Block / Location</label>
                  <input
                    type="text"
                    required
                    value={newComplaintData.location}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newComplaintData.room_number}
                    onChange={(e) => setNewComplaintData({ ...newComplaintData, room_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newComplaintData.description}
                  onChange={(e) => setNewComplaintData({ ...newComplaintData, description: e.target.value })}
                  placeholder="Provide complete breakdown of the maintenance issue..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewComplaintOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setIsNewLostFoundOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Catalog Lost / Found Item</h3>

            <form onSubmit={handleCreateLostFound} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Report Type</label>
                  <select
                    value={newLostFoundData.item_type}
                    onChange={(e) => setNewLostFoundData({ ...newLostFoundData, item_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Category</label>
                  <select
                    value={newLostFoundData.category}
                    onChange={(e) => setNewLostFoundData({ ...newLostFoundData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
                <label className="text-xs font-mono text-slate-400 block mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={newLostFoundData.title}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, title: e.target.value })}
                  placeholder="e.g. Titan Silver Wristwatch"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Found / Lost Location</label>
                <input
                  type="text"
                  required
                  value={newLostFoundData.location}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, location: e.target.value })}
                  placeholder="e.g. 1st Floor Study Room, Mess Gate"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newLostFoundData.description}
                  onChange={(e) => setNewLostFoundData({ ...newLostFoundData, description: e.target.value })}
                  placeholder="Describe unique markings, color, brand..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLostFoundOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
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
