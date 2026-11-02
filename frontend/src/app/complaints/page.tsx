"use client";

import { useEffect, useState } from "react";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { getComplaints } from "@/lib/api";
import { Plus, AlertCircle, Filter } from "lucide-react";
import type { Complaint } from "@/types";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await getComplaints(statusFilter === "all" ? undefined : statusFilter);
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const handleCreated = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
    setIsModalOpen(false);
  };

  const filterTabs = [
    { key: "all", label: "All Complaints" },
    { key: "submitted", label: "Submitted" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-white/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Hostel Complaints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Register maintenance issues and track resolution updates in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-luminous-primary rounded-full text-xs font-semibold px-5 py-2.5 flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>File New Complaint</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-card rounded-full overflow-x-auto w-max border border-white/80 shadow-sm">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.key
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-white/80 shadow-sm space-y-2">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-slate-800 text-sm">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 font-medium">
            You currently have no registered issues in this category.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register an Issue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Hostel Complaint"
      >
        <ComplaintForm
          onSuccess={handleCreated}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
