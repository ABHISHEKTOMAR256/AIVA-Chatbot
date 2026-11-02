"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { getAdminComplaints, updateComplaint } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { AlertCircle, Filter, CheckCircle2, UserCheck, Shield } from "lucide-react";
import type { Complaint, ComplaintStatus } from "@/types";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("acknowledged");
  const [staffReply, setStaffReply] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getAdminComplaints();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load admin complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleOpenManage = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setNewStatus(comp.status);
    setStaffReply(comp.staff_reply || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setIsUpdating(true);
      await updateComplaint(selectedComplaint.id, {
        status: newStatus,
        staff_reply: staffReply || undefined,
      });
      setSelectedComplaint(null);
      await loadComplaints();
    } catch (err: any) {
      alert("Failed to update complaint: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin Complaint Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Review, assign staff, and update resolution status for all hostel complaints.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h3 className="font-bold text-slate-800 text-sm">No complaints logged</h3>
          <p className="text-xs text-slate-500 font-medium">
            Complaints submitted by students will appear in this administrative table.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-4 px-5">Ref Number</th>
                  <th className="py-4 px-5">Student</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Title &amp; Room</th>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Reported</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-4 px-5 font-mono font-bold text-blue-600">
                      {c.reference_number}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {c.user?.full_name || "Resident"}
                    </td>
                    <td className="py-4 px-5 capitalize text-slate-600 font-medium">
                      {c.category.replace("_", " ")}
                    </td>
                    <td className="py-4 px-5 max-w-xs truncate">
                      <span className="font-semibold text-slate-900 block truncate">{c.title}</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Room {c.room_number || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          c.priority === "urgent"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : c.priority === "high"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                          c.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs font-medium">
                      {formatRelativeTime(c.created_at)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleOpenManage(c)}
                        className="px-3.5 py-1.5 rounded-full glass-card hover:bg-white text-xs font-semibold text-blue-600 shadow-sm transition-all cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={`Update Complaint ${selectedComplaint?.reference_number}`}
      >
        {selectedComplaint && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-1">Issue Title:</p>
              <p className="text-sm font-semibold text-slate-900">{selectedComplaint.title}</p>
              <p className="text-xs text-slate-500 mt-1">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Update Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                className="w-full glass-input text-xs rounded-2xl p-3 outline-none cursor-pointer"
              >
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged (Verified by staff)</option>
                <option value="in_progress">In Progress (Staff/Technician working)</option>
                <option value="resolved">Resolved (Repairs completed)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Staff Reply / Note to Student
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Electrician visited Room 302 and replaced the switch capacitor."
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                className="w-full glass-input text-xs rounded-2xl p-3 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2.5 rounded-full glass-card hover:bg-white text-slate-600 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-md"
              >
                {isUpdating ? "Saving..." : "Save Status"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
