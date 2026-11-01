"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { getKnowledgeDocs, addKnowledgeDoc } from "@/lib/api";
import { FileText, Plus, BookOpen, Trash2, CheckCircle2 } from "lucide-react";
import type { KnowledgeDoc } from "@/types";

export default function AdminKnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("rules");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeDocs();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load knowledge documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      const newDoc = await addKnowledgeDoc({ title, content, category });
      setDocs((prev) => [newDoc, ...prev]);
      setIsModalOpen(false);
      setTitle("");
      setContent("");
    } catch (err: any) {
      alert("Failed to add knowledge document: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Knowledge Base & RAG Index
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Documents embedded for Retrieval-Augmented Generation to answer student queries.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-semibold px-4 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Knowledge Document
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-gray-800 text-sm">No knowledge documents ingested</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            Add hostel rulebooks, mess guidelines, and FAQ procedures to train the RAG system.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white text-xs">
            <Plus className="w-4 h-4 mr-1" /> Add Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {doc.category}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">{doc.title}</h3>
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {doc.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Knowledge Document (RAG)"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Document Title *
            </label>
            <Input
              placeholder="e.g. Hostel Wi-Fi Connection Guide"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="rules">Hostel Rules & Discipline</option>
              <option value="faq">Frequently Asked Questions</option>
              <option value="procedures">Check-in / Check-out Procedures</option>
              <option value="facilities">Mess, Laundry & Facilities</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Document Text / Content *
            </label>
            <textarea
              rows={8}
              placeholder="Paste guidelines, timings, step-by-step procedures, or rules..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white">
              {isSubmitting ? "Ingesting..." : "Ingest into RAG"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
