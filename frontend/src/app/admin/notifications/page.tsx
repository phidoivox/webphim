import { Suspense } from "react";
import AdminNotificationsClient from "./AdminNotificationsClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminNotificationsClient />
    </Suspense>
  );
}
