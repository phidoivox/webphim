"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

interface BackendStatus {
  status: string;
  message: string;
  timestamp: string;
  framework: string;
}

export default function KetNoi() {
  const [data, setData] = useState<BackendStatus | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { baseUrl, data: json } = await fetchJson<BackendStatus>("/status");
      setData(json);
      setActiveUrl(baseUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    }
    setLoading(false);
  };

  useEffect(() => {
    // Trạng thái khởi tạo đã là loading=true — setState chỉ xảy ra trong callback async
    let mounted = true;
    fetchJson<BackendStatus>("/status")
      .then(({ baseUrl, data: json }) => {
        if (!mounted) return;
        setData(json);
        setActiveUrl(baseUrl);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
              W
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">WebPhim Stack Connection Test</h1>
              <p className="text-sm text-slate-400">Next.js Frontend ↔️ Laravel Backend (Laragon)</p>
            </div>
          </div>
          <button
            onClick={checkConnection}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Đang thử lại..." : "Thử kết nối lại"}
          </button>
        </div>

        {/* Status Card */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-sm font-medium text-slate-300">Đang tự động phát hiện và kết nối đến Laravel API...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex flex-col gap-2">
              <div className="flex items-center space-x-2 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Chưa thể kết nối tới Backend</span>
              </div>
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>KẾT NỐI BẮT CẦU THÀNH CÔNG!</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-200 font-mono">
                  200 OK
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-mono mt-1">
                Đang kết nối qua URL: <span className="underline">{activeUrl}</span>
              </p>
            </div>
          )}
        </div>

        {/* Response JSON Output */}
        {data && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dữ liệu phản hồi thực tế từ Laravel API:</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-wrap gap-4 text-xs text-slate-400 justify-between">
          <div>Frontend: Next.js (Port 3000)</div>
          <div>Backend Domain: {activeUrl || "Laragon Webphim"}</div>
        </div>

      </div>
    </main>
  );
}
