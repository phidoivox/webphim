import { Suspense } from "react";
import AdminDashboardClient from "./AdminDashboardClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
