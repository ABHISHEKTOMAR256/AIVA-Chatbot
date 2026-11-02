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
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
              RAG VECTOR RETRIEVAL ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            AI Knowledge Base & Index
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Ingest and index official hostel guidelines, FAQs, and regulations into pgvector for AIVA chatbot semantic search.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ingest Document</span>
        </button>
      </div>

      {/* RAG Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19]/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>TOTAL DOCUMENTS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{docs.length}</div>
          <span className="text-[10px] text-cyan-400/80 font-mono mt-1 block">Active RAG corpus</span>
        </div>

        <div className="bg-[#0b0f19]/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>VECTOR STORE</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">pgvector</div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Cosine distance (<span className="text-cyan-400">&lt;=&gt;</span>)</span>
        </div>

        <div className="bg-[#0b0f19]/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>EMBEDDING MODEL</span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-base font-bold font-mono text-violet-300">all-MiniLM-L6-v2</div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">384-dimensional dense vectors</span>
        </div>

        <div className="bg-[#0b0f19]/60 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>AI MATCH LATENCY</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">~14ms</div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Index similarity lookups</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guidelines, rules, FAQs..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {["all", "rules", "faq", "procedures", "facilities"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
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
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Querying pgvector knowledge index...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-[#0b0f19]/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
          <h3 className="font-bold text-white text-sm font-mono">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            {searchTerm ? "No guidelines matched your search criteria." : "No documents have been ingested yet."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono transition-all"
          >
            + Ingest First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#0b0f19]/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/30 rounded-xl p-5 space-y-3 transition-all hover:shadow-[0_0_25px_rgba(0,240,255,0.05)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Deactivate document"
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                  {doc.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Embedded in pgvector
                </span>
                <span>ID: {doc.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ingest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,240,255,0.15)] text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Ingest Document into RAG
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Chunks will be converted to dense embeddings and indexed
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Wi-Fi Connection Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="rules">Hostel Rules & Discipline</option>
                  <option value="faq">Frequently Asked Questions (FAQ)</option>
                  <option value="procedures">Check-in / Check-out Procedures</option>
                  <option value="facilities">Mess, Laundry & Amenities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Document Content (Guidelines / Rules) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste guidelines, timings, step-by-step procedures, or rules..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
