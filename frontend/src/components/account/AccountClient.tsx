"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  addMovieToCollectionApi,
  createCollectionApi,
  deleteCollectionApi,
  getUserCollectionsApi,
  getUserProfileApi,
  removeMovieFromCollectionApi,
  getUserCollectionDetailApi,
  searchLiveSuggestions,
  updateCollectionApi,
  updateUserProfileApi,
} from "@/lib/api";
import { setFormApiErrors } from "@/lib/form-utils";
import { useDebounce } from "@/hooks/useDebounce";
import type { CollectionDetail, CollectionSummary } from "@/types/collection";
import type { MovieSummary } from "@/types/movie";
import {
  changePasswordSchema,
  collectionSchema,
  profileSchema,
  type ChangePasswordInput,
  type CollectionInput,
  type ProfileInput,
} from "@/schemas/collection";
import PasswordInput from "@/components/auth/PasswordInput";
import MovieCard from "@/components/movie/MovieCard";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/icons";

const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Phim1",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Phim2",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Phim3",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Anime1",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Anime2",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Vui1",
  "https://api.dicebear.com/9.x/personas/svg?seed=Hero1",
];

type Tab = "profile" | "collections";

export default function AccountClient() {
  const { user, token, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [stats, setStats] = useState({ collectionsCount: 0, bookmarksCount: 0 });
  const [memberSince, setMemberSince] = useState<string | null>(null);

  // Callback ổn định — tránh loop fetch lại trong CollectionsTab
  // (inline arrow mỗi render tạo fn mới -> fetchList đổi -> useEffect chạy lại vô hạn)
  const handleCountChange = useCallback(
    (n: number) => setStats((s) => ({ ...s, collectionsCount: n })),
    []
  );
  const handleRefreshUser = useCallback(() => void refreshUser(), [refreshUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/dang-nhap?redirect=/profile");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;
    getUserProfileApi(token)
      .then((data) => {
        setStats(data.stats);
        setMemberSince(data.user.createdAt);
      })
      .catch(() => {});
  }, [token]);

  if (authLoading || !isAuthenticated || !user) {
    return <ProfileSkeleton />;
  }

  const initialLetter = user.name.trim().charAt(0).toUpperCase();
  const isVip = user.subscriptionType === "vip" || user.subscriptionType === "premium";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12">
      {/* Cover banner */}
      <div className="relative h-40 overflow-hidden rounded-b-3xl bg-gradient-to-r from-accent via-fuchsia-600 to-indigo-600 sm:h-48">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,.35) 0, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,.25) 0, transparent 35%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Card nổi */}
      <div className="relative -mt-12 rounded-3xl border border-white/10 bg-[#14141a]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative -mt-14 shrink-0 sm:-mt-16">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#14141a] bg-white/10 text-2xl font-extrabold text-accent sm:h-24 sm:w-24">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>
            <button
              type="button"
              onClick={() => setTab("profile")}
              aria-label="Đổi avatar"
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-accent text-white transition hover:bg-accent/80 cursor-pointer"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">{user.name}</h1>
              {isVip && (
                <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  VIP
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-white/50">{user.email}</p>
            <p className="mt-0.5 text-xs text-white/50">Thành viên từ {formatMemberSince(memberSince)}</p>
          </div>
          <div className="flex shrink-0 gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-xl font-extrabold text-white">{stats.collectionsCount}</p>
              <p className="text-[11px] font-medium text-white/50">Bộ sưu tập</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-white">{stats.bookmarksCount}</p>
              <p className="text-[11px] font-medium text-white/50">Phim đã lưu</p>
            </div>
          </div>
        </div>

        {/* Tabs pill */}
        <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer sm:text-sm ${tab === "profile" ? "bg-accent text-white shadow-lg shadow-accent/25" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
          >
            Thông tin tài khoản
          </button>
          <button
            type="button"
            onClick={() => setTab("collections")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer sm:text-sm ${tab === "collections" ? "bg-accent text-white shadow-lg shadow-accent/25" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
          >
            Bộ sưu tập của tôi
          </button>
        </div>
      </div>

      <div className="mt-6">
        {tab === "profile" ? (
          <ProfileTab token={token} onUpdated={handleRefreshUser} />
        ) : (
          <CollectionsTab token={token} onCountChange={handleCountChange} />
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 pb-12">
      <div className="h-40 rounded-b-3xl bg-white/5 sm:h-48" />
      <div className="relative -mt-12 rounded-3xl border border-white/10 bg-[#14141a] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="-mt-14 h-20 w-20 rounded-full bg-white/10 sm:-mt-16 sm:h-24 sm:w-24" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded-lg bg-white/10" />
            <div className="h-3.5 w-32 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
      <div className="mt-6 h-64 rounded-3xl bg-white/5" />
    </div>
  );
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return "…";
  const d = new Date(iso);
  return `tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
}

/* ---------- Tab thông tin tài khoản ---------- */

function ProfileTab({ token, onUpdated }: { token: string | null; onUpdated: () => void }) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", avatar_url: user?.avatarUrl ?? "" },
  });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    setError: setErrorPw,
    reset: resetPw,
    formState: { errors: errorsPw, isSubmitting: isSubmittingPw },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    reset({ name: user?.name ?? "", avatar_url: user?.avatarUrl ?? "" });
  }, [user, reset]);

  const avatarUrl = watch("avatar_url");

  const onSubmitProfile = async (data: ProfileInput) => {
    try {
      const res = await updateUserProfileApi(
        { name: data.name.trim(), avatar_url: data.avatar_url?.trim() || null },
        token
      );
      toast.success(res.message || "Cập nhật thông tin thành công.");
      onUpdated();
    } catch (err) {
      setFormApiErrors(err, setError, (m) => toast.error(m));
    }
  };

  const onSubmitPassword = async (data: ChangePasswordInput) => {
    try {
      const res = await updateUserProfileApi(
        {
          current_password: data.current_password,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
        token
      );
      toast.success(res.message || "Đổi mật khẩu thành công.");
      resetPw();
    } catch (err) {
      setFormApiErrors(err, setErrorPw, (m) => toast.error(m));
    }
  };

  const inputCls = (hasError?: string) =>
    `h-11 w-full rounded-xl border bg-white/[0.04] px-3.5 text-sm text-ink placeholder:text-muted/50 transition-all focus:outline-none ${
      hasError ? "border-red-500/80" : "border-white/10 focus:border-accent"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-bold text-white">Thông tin hiển thị</h2>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Tên hiển thị</label>
          <input {...register("name")} placeholder="Tên của bạn" className={inputCls(errors.name?.message)} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_PRESETS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setValue("avatar_url", url, { shouldDirty: true })}
                className={`h-12 w-12 overflow-hidden rounded-full border-2 transition cursor-pointer ${avatarUrl === url ? "border-accent" : "border-white/10 hover:border-white/40"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Avatar mẫu" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <input {...register("avatar_url")} placeholder="hoặc dán link ảnh https://…" className={`${inputCls(errors.avatar_url?.message)} mt-2`} />
          {errors.avatar_url && <p className="mt-1 text-xs text-red-400">{errors.avatar_url.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl bg-accent text-sm font-bold text-white transition hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>

      <form onSubmit={handleSubmitPw(onSubmitPassword)} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-bold text-white">Đổi mật khẩu</h2>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Mật khẩu hiện tại</label>
          <PasswordInput {...registerPw("current_password")} placeholder="Nhập mật khẩu hiện tại" error={errorsPw.current_password?.message} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Mật khẩu mới</label>
          <PasswordInput {...registerPw("password")} placeholder="Ít nhất 6 ký tự" autoComplete="new-password" error={errorsPw.password?.message} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Xác nhận mật khẩu mới</label>
          <PasswordInput {...registerPw("password_confirmation")} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" error={errorsPw.password_confirmation?.message} />
        </div>
        <button
          type="submit"
          disabled={isSubmittingPw}
          className="h-11 w-full rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
        >
          {isSubmittingPw ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}

/* ---------- Tab bộ sưu tập ---------- */

function CollectionsTab({ token, onCountChange }: { token: string | null; onCountChange: (n: number) => void }) {
  const [items, setItems] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CollectionSummary | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getUserCollectionsApi(token);
      setItems(data);
    } catch {
      toast.error("Không tải được danh sách bộ sưu tập.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // Đồng bộ số lượng về parent sau render — không gọi setState parent trong render/updater
  useEffect(() => {
    onCountChange(items.length);
  }, [items.length, onCountChange]);

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bộ sưu tập này? Phim bên trong không bị xóa.")) return;
    try {
      await deleteCollectionApi(id, token);
      toast.success("Đã xóa bộ sưu tập.");
      setItems((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      toast.error("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/bo-suu-tap/${slug}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Đã copy link chia sẻ!"),
      () => toast.error("Không copy được link.")
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => {
          setEditing(null);
          setShowModal(true);
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] text-sm font-bold text-white/70 transition hover:border-accent/60 hover:text-white cursor-pointer"
      >
        <PlusIcon className="h-4 w-4" /> Tạo bộ sưu tập mới
      </button>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/50">
          Bạn chưa có bộ sưu tập nào. Tạo ngay để gom phim theo chủ đề riêng!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex gap-3 p-4">
                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {c.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbUrl} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">🎬</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-white">{c.name}</h3>
                    {c.isPublic ? (
                      <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Công khai</span>
                    ) : (
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/50">Riêng tư</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">{c.moviesCount} phim</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                      className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-white/20 cursor-pointer"
                    >
                      {selectedId === c.id ? "Đóng" : "Xem/Sửa"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c);
                        setShowModal(true);
                      }}
                      className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70 transition hover:bg-white/20 hover:text-white cursor-pointer"
                    >
                      Sửa
                    </button>
                    {c.isPublic && (
                      <button
                        type="button"
                        onClick={() => copyShareLink(c.slug)}
                        className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70 transition hover:bg-white/20 hover:text-white cursor-pointer"
                      >
                        <ExternalLinkIcon className="h-3 w-3" /> Chia sẻ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.id)}
                      aria-label={`Xóa ${c.name}`}
                      className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 transition hover:bg-red-500/20 cursor-pointer"
                    >
                      <TrashIcon className="h-3 w-3" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
              {selectedId === c.id && <CollectionDetail token={token} collectionId={c.id} />}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CollectionModal
          token={token}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSaved={(saved, isNew) => {
            setShowModal(false);
            setItems((prev) =>
              isNew ? [saved, ...prev] : prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
            );
          }}
        />
      )}
    </div>
  );
}

function CollectionModal({
  token,
  initial,
  onClose,
  onSaved,
}: {
  token: string | null;
  initial: CollectionSummary | null;
  onClose: () => void;
  onSaved: (saved: CollectionSummary, isNew: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      is_public: initial?.isPublic ?? true,
    },
  });

  const onSubmit = async (data: CollectionInput) => {
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        is_public: data.is_public,
      };
      if (initial) {
        const updated = await updateCollectionApi(initial.id, payload, token);
        toast.success("Cập nhật bộ sưu tập thành công.");
        onSaved(updated, false);
      } else {
        const created = await createCollectionApi(payload, token);
        toast.success("Tạo bộ sưu tập thành công.");
        onSaved(created, true);
      }
    } catch (err) {
      setFormApiErrors(err, setError, (m) => toast.error(m));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#16161d] p-6"
      >
        <h2 className="text-base font-extrabold text-white">{initial ? "Sửa bộ sưu tập" : "Tạo bộ sưu tập mới"}</h2>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Tên bộ sưu tập</label>
          <input
            {...register("name")}
            placeholder="VD: Phim Anime bất hủ"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-ink placeholder:text-muted/50 focus:border-accent focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/70">Mô tả (không bắt buộc)</label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Mô tả ngắn về bộ sưu tập…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-accent focus:outline-none"
          />
          {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <GlobeIcon className="h-4 w-4 text-emerald-400" /> Công khai (ai cũng xem được)
          </span>
          <input {...register("is_public")} type="checkbox" className="h-5 w-5 accent-amber-500" />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white/70 transition hover:bg-white/10 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-white transition hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Đang lưu…" : initial ? "Lưu" : "Tạo mới"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CollectionDetail({ token, collectionId }: { token: string | null; collectionId: number }) {
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 250);
  const [suggestions, setSuggestions] = useState<MovieSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setDetail(await getUserCollectionDetailApi(collectionId, token));
    } catch {
      toast.error("Không tải được chi tiết bộ sưu tập.");
    } finally {
      setLoading(false);
    }
  }, [token, collectionId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!showAdd || !debouncedKeyword.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchLiveSuggestions(debouncedKeyword.trim(), 8)
      .then((res) => {
        if (!cancelled) setSuggestions(res.movies);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword, showAdd]);

  const movieIds = useMemo(() => new Set((detail?.movies ?? []).map((m) => m.id)), [detail]);

  const handleAdd = async (movie: MovieSummary) => {
    if (movieIds.has(movie.id)) {
      toast.info("Phim đã có trong bộ sưu tập.");
      return;
    }
    try {
      const updated = await addMovieToCollectionApi(collectionId, movie.id, token);
      setDetail(updated);
      toast.success(`Đã thêm "${movie.name}".`);
    } catch {
      toast.error("Thêm phim thất bại.");
    }
  };

  const handleRemove = async (movieId: number, name: string) => {
    try {
      await removeMovieFromCollectionApi(collectionId, movieId, token);
      setDetail((prev) =>
        prev ? { ...prev, movies: prev.movies.filter((m) => m.id !== movieId), moviesCount: prev.moviesCount - 1 } : prev
      );
      toast.success(`Đã gỡ "${name}".`);
    } catch {
      toast.error("Gỡ phim thất bại.");
    }
  };

  if (loading) return <div className="animate-pulse border-t border-white/10 p-4 text-xs text-white/40">Đang tải phim…</div>;
  if (!detail) return null;

  return (
    <div className="space-y-3 border-t border-white/10 p-4">
      <button
        type="button"
        onClick={() => setShowAdd((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-xs font-bold text-white/70 transition hover:border-accent/60 hover:text-white cursor-pointer"
      >
        <PlusIcon className="h-3.5 w-3.5" /> Thêm phim
      </button>

      {showAdd && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Gõ tên phim để tìm và thêm…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
          </div>
          {searching && <p className="text-[11px] text-white/40">Đang tìm…</p>}
          {suggestions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => void handleAdd(m)}
              disabled={movieIds.has(m.id)}
              className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
            >
              <div className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-white/10">
                {m.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.posterUrl} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{m.name}</p>
                <p className="truncate text-[11px] text-white/50">
                  {m.year ?? "—"} · ★ {m.ratingAvg?.toFixed(1) ?? "—"}
                </p>
              </div>
              {movieIds.has(m.id) ? (
                <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <PlusIcon className="h-4 w-4 shrink-0 text-white/50" />
              )}
            </button>
          ))}
          {debouncedKeyword.trim() && !searching && suggestions.length === 0 && (
            <p className="text-[11px] text-white/40">Không tìm thấy phim nào.</p>
          )}
        </div>
      )}

      {detail.movies.length === 0 ? (
        <p className="text-center text-xs text-white/40">Chưa có phim nào. Bấm “Thêm phim” để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {detail.movies.map((m) => (
            <div key={m.id} className="group relative">
              <MovieCard movie={m} />
              <button
                type="button"
                onClick={() => void handleRemove(m.id, m.name)}
                aria-label={`Gỡ ${m.name}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500 hover:text-white cursor-pointer"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {detail.isPublic && (
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/bo-suu-tap/${detail.slug}`;
            void navigator.clipboard.writeText(url).then(
              () => toast.success("Đã copy link chia sẻ!"),
              () => toast.error("Không copy được link.")
            );
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <CopyIcon className="h-3.5 w-3.5" /> Copy link: /bo-suu-tap/{detail.slug}
        </button>
      )}
    </div>
  );
}
