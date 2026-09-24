import { Suspense } from "react";
import AdminMovieEditClient from "./AdminMovieEditClient";
import AdminPageSkeleton from "@/components/ui/skeletons/AdminPageSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditMovieContent({ params }: PageProps) {
  const { id } = await params;
  return <AdminMovieEditClient id={id} />;
}

export default function EditMoviePage({ params }: PageProps) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <EditMovieContent params={params} />
    </Suspense>
  );
}
