"use client";

import Dashboard from "@/pages/DashboardPage";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function DashBoardPageRouter() {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Loading your dashboard..." size="large" />;
  if (!user?.email) return redirect("/login");

  return <Dashboard />;
}