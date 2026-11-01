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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Hostel Complaints
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Register maintenance issues and track resolution updates in real-time.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-semibold px-4 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          File New Complaint
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-gray-400 mr-1" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-gray-800 text-sm">No complaints found</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            You currently have no registered issues in this category.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Register an Issue
          </Button>
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
