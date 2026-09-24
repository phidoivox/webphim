import { Suspense } from "react";
import AdminGenresClient from "./AdminGenresClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminGenresPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGenresClient />
    </Suspense>
  );
}
