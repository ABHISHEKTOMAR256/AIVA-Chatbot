"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
        An unexpected error occurred while rendering the page. You can try refreshing the component.
      </p>
      <Button
        onClick={() => reset()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2"
      >
        <RotateCcw className="w-4 h-4 mr-1.5" /> Try Again
      </Button>
    </div>
  );
}
