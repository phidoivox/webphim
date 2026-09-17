import { Suspense } from "react";
import AdminUsersClient from "./AdminUsersClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminUsersClient />
    </Suspense>
  );
}
