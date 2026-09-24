import { Suspense } from "react";
import AdminCommentsClient from "./AdminCommentsClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminCommentsClient />
    </Suspense>
  );
}
