import { Suspense } from "react";
import AdminReportsClient from "./AdminReportsClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminReportsClient />
    </Suspense>
  );
}
