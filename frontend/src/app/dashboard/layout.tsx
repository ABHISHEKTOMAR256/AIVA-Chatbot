"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";
import type { User } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      // 1. Check Firebase authenticated user in localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("aiva_firebase_user");
        if (stored) {
          try {
            const fbUser = JSON.parse(stored);
            if (fbUser && fbUser.email) {
              setUser({
                id: fbUser.uid || "firebase-user",
                email: fbUser.email || "",
                full_name:
                  fbUser.displayName ||
                  fbUser.email?.split("@")[0] ||
                  "Student Resident",
                avatar_url: fbUser.photoURL || undefined,
                role: "student",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error reading firebase session:", e);
          }
        }
      }

      // 2. Check Supabase session
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        // In local development with mock, provide a development user
        setUser({
          id: "11111111-1111-1111-1111-111111111111",
          email: "student@university.edu",
          full_name: "Student Resident",
          role: "student",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        full_name:
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "Student",
        avatar_url: authUser.user_metadata?.avatar_url,
        role: (authUser.user_metadata?.role as any) || "student",
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
      });
      setLoading(false);
    }

    loadUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luminous-mesh">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luminous-mesh flex flex-col text-slate-900">
      <div className="p-4 max-w-7xl mx-auto w-full">
        <Header user={user} />
      </div>
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 pb-6 gap-6">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
