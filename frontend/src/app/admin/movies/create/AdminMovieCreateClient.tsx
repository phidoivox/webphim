"use client";

import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import MovieForm from "@/components/admin/MovieForm";
import { ChevronLeftIcon } from "@/components/ui/icons";

export default function AdminMovieCreateClient() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
      <AdminPageHeader
        title="Thêm Phim Mới"
        description="Điền thông tin và thiết lập hình ảnh, trailer và tập phim."
      >
        <Link
          href="/admin/movies"
          className="flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          <span>Danh sách phim</span>
        </Link>
      </AdminPageHeader>

      <MovieForm isEdit={false} />
    </main>
  );
}
