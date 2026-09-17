import { Suspense } from "react";
import AdminMovieCreateClient from "./AdminMovieCreateClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

export default function CreateMoviePage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminMovieCreateClient />
    </Suspense>
  );
}
