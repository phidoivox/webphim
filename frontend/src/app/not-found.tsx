import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center lg:px-10">
      <span className="text-6xl font-black text-accent">404</span>
      <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
        Không tìm thấy trang hoặc phim
      </h1>
      <p className="mt-2 text-sm text-gray-400">
        Nội dung bạn đang tìm kiếm có thể đã bị xóa hoặc đường dẫn không chính xác.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:scale-105"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
