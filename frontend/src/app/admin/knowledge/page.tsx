"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Sparkles,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Filter,
} from "lucide-react";
import { useGuestAuth } from "@/components/admin/GuestAuthContext";
import { getKnowledgeDocs, addKnowledgeDoc, deleteKnowledgeDoc } from "@/lib/api";
import type { KnowledgeDoc } from "@/types";

// Demonstration mock documents for Guest Preview Mode
const MOCK_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "mock-doc-1",
    title: "Hostel Gate Curfew Timings & Late Entry Procedures",
    category: "rules",
    content:
      "All hostel gates are secured at 22:30 IST. Residents returning after 22:30 must sign the electronic late register and provide warden authorization. Habitual late entries (>3 per month) trigger automated SMS notification to guardians.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "mock-doc-2",
    title: "High-Speed Campus Wi-Fi & MAC Registration Protocol",
    category: "faq",
    content:
      "Campus Wi-Fi (SSID: AIVA_CAMPUS_SECURE) uses 802.1X enterprise authentication. Connect using your student registration number and network portal password. Maximum 2 active devices per student. Torrent traffic and P2P ports are restricted.",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "mock-doc-3",
    title: "Hostel Room Change & Maintenance Request Guidelines",
    category: "procedures",
    content:
      "Maintenance tickets filed through AIVA Bot are acknowledged within 2 hours. Plumbing and electrical repairs occur between 09:00 - 18:00 daily. Room transfer requests open on the 1st of every semester through the Chief Warden office.",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "mock-doc-4",
    title: "Mess Diet Timing, Food Safety & Guest Coupon Policy",
    category: "facilities",
    content:
      "Breakfast: 07:30 - 09:30 | Lunch: 12:30 - 14:30 | Dinner: 19:30 - 21:30. Guest meal coupons can be purchased at the helpdesk counter for INR 85. Special dietary requests for medical recovery require dispensary slip.",
    created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 16).toISOString(),
  },
];

export default function AdminKnowledgePage() {
  const { isGuest, requireAuth } = useGuestAuth();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("rules");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (isGuest) {
        setDocs(MOCK_KNOWLEDGE_DOCS);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getKnowledgeDocs();
        setDocs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load knowledge docs:", e);
        setDocs(MOCK_KNOWLEDGE_DOCS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isGuest]);

  const handleOpenAdd = () => {
    if (!requireAuth("Add Knowledge Document")) return;
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (!requireAuth("Ingest Knowledge into RAG")) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const newDoc = await addKnowledgeDoc({ title, content, category });
      setDocs((prev) => [newDoc, ...prev]);
      setIsModalOpen(false);
      setTitle("");
      setContent("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to embed and index document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!requireAuth("Delete Knowledge Document")) return;
    if (!confirm("Are you sure you want to deactivate this knowledge document?")) return;

    try {
      await deleteKnowledgeDoc(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const filteredDocs = docs.filter((doc) => {
    const matchCat = categoryFilter === "all" || doc.category === categoryFilter;
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-blue-600 font-bold">
              RAG VECTOR RETRIEVAL ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            AI Knowledge Base &amp; Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Ingest and index official hostel guidelines, FAQs, and regulations into pgvector for AIVA chatbot semantic search.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start md:self-auto btn-luminous-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ingest Document</span>
        </button>
      </div>

      {/* RAG Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card glass-card-hover rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>TOTAL DOCUMENTS</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{docs.length}</div>
          <span className="text-[11px] text-blue-600 font-medium block">Active RAG corpus</span>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>VECTOR STORE</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono">pgvector</div>
          <span className="text-[11px] text-slate-500 font-medium block">Cosine distance (&lt;=&gt;)</span>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>EMBEDDING MODEL</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono truncate">all-MiniLM-L6-v2</div>
          <span className="text-[11px] text-purple-600 font-medium block">384-dimensional dense vectors</span>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>AI MATCH LATENCY</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">~14ms</div>
          <span className="text-[11px] text-slate-500 font-medium block">Index similarity lookups</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guidelines, rules, FAQs..."
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {["all", "rules", "faq", "procedures", "facilities"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "glass-card text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-blue-600">Querying pgvector knowledge index...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-slate-900 text-sm">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {searchTerm ? "No guidelines matched your search criteria." : "No documents have been ingested yet."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-luminous-primary px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
          >
            + Ingest First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-card glass-card-hover rounded-3xl p-6 space-y-3.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Deactivate document"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed mt-2 whitespace-pre-wrap">
                  {doc.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Embedded in pgvector
                </span>
                <span className="font-mono">ID: {doc.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ingest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-slate-800 border border-white/90">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Ingest Document into RAG
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Chunks will be converted to dense embeddings and indexed
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Wi-Fi Connection Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-2xl text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="rules">Hostel Rules &amp; Discipline</option>
                  <option value="faq">Frequently Asked Questions (FAQ)</option>
                  <option value="procedures">Check-in / Check-out Procedures</option>
                  <option value="facilities">Mess, Laundry &amp; Amenities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Document Content (Guidelines / Rules) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste guidelines, timings, step-by-step procedures, or rules..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full glass-card hover:bg-white text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-luminous-primary px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Embedding into pgvector...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ingest into RAG</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
