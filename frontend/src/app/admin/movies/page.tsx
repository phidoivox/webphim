import { Suspense } from "react";
import AdminMoviesClient from "./AdminMoviesClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminMoviesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminMoviesClient />
    </Suspense>
  );
}
