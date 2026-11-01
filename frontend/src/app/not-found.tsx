import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        The helpdesk page or resource you are looking for does not exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
