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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Admin Complaint Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review, assign staff, and update resolution status for all hostel complaints.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-gray-800 text-sm">No complaints logged</h3>
          <p className="text-xs text-gray-500 mt-1">
            Complaints submitted by students will appear in this administrative table.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Room</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {c.reference_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {c.user?.full_name || "Resident"}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-gray-600">
                      {c.category.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="font-semibold text-gray-900 block truncate">{c.title}</span>
                      <span className="text-[11px] text-gray-400">
                        Room {c.room_number || "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : c.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === "resolved" ? "success" : "warning"}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {formatRelativeTime(c.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        onClick={() => handleOpenManage(c)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        Update
                      </Button>
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
              <p className="text-xs font-bold text-gray-700 mb-1">Issue Title:</p>
              <p className="text-sm font-semibold text-gray-900">{selectedComplaint.title}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Update Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged (Verified by staff)</option>
                <option value="in_progress">In Progress (Staff/Technician working)</option>
                <option value="resolved">Resolved (Repairs completed)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Staff Reply / Note to Student
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Electrician visited Room 302 and replaced the switch capacitor."
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setSelectedComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="bg-indigo-600 text-white">
                {isUpdating ? "Saving..." : "Save Status"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
