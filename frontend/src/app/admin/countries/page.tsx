import { Suspense } from "react";
import AdminCountriesClient from "./AdminCountriesClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function AdminCountriesPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminCountriesClient />
    </Suspense>
  );
}
