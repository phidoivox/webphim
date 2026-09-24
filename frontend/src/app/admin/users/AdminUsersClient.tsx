"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdminUserApi,
  getAdminDashboardStatsApi,
  getAdminUsersApi,
  updateAdminUserApi,
} from "@/lib/api";
import type { AdminUserItem } from "@/types/admin";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  KeyIcon,
  LockIcon,
  MailIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrashIcon,
  UnlockIcon,
  UserCheckIcon,
  UserIcon,
  UserXIcon,
  XIcon,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminUserEditSchema, type AdminUserEditInput } from "@/schemas/user";
import { setFormApiErrors } from "@/lib/form-utils";

export default function AdminUsersClient() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, perPage: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Global KPI numbers
  const [kpiTotalUsers, setKpiTotalUsers] = useState<number>(0);
  const [kpiAdmins, setKpiAdmins] = useState<number>(0);
  const [kpiMods, setKpiMods] = useState<number>(0);
  const [kpiInactive, setKpiInactive] = useState<number>(0);

  // User Detail Slide-over Drawer
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetUserForm,
    setError: setUserFormError,
    formState: { errors: userFormErrors, isSubmitting: drawerSaving },
  } = useForm<AdminUserEditInput>({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      is_active: true,
      password: "",
    },
  });

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (type === "error") toast.error(text);
    else toast.success(text);
  };

  const loadKpis = async () => {
    try {
      const stats = await getAdminDashboardStatsApi(token);
      if (stats?.kpis?.totalUsers !== undefined) {
        setKpiTotalUsers(stats.kpis.totalUsers);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsersApi(
        {
          q: search || undefined,
          role: role || undefined,
          is_active: statusFilter !== "" ? statusFilter : undefined,
          page,
          per_page: 20,
        },
        token
      );
      setUsers(res.data || []);
      setMeta(res.meta || { currentPage: 1, lastPage: 1, total: 0, perPage: 20 });

      // Compute local KPI counts if viewing all
      if (!role && statusFilter === "" && !search) {
        setKpiTotalUsers(res.meta.total);
        const adminCount = res.data.filter((u) => u.role === "admin").length;
        const modCount = res.data.filter((u) => u.role === "moderator").length;
        const bannedCount = res.data.filter((u) => !u.is_active).length;
        setKpiAdmins(adminCount);
        setKpiMods(modCount);
        setKpiInactive(bannedCount);
      }
    } catch (err: any) {
      showToast(err?.message || "Không thể tải danh sách người dùng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [search, role, statusFilter, page, token]);

  const handleRoleChange = async (userId: number, newRole: "admin" | "moderator" | "user") => {
    try {
      await updateAdminUserApi(userId, { role: newRole }, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
        resetUserForm((prev) => ({ ...prev, role: newRole }));
      }
      showToast("Đã cập nhật vai trò thành công!");
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi đổi quyền người dùng.", "error");
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    if (currentUser?.id === userId && currentActive) {
      showToast("Bạn không thể tự khóa tài khoản của chính mình.", "error");
      return;
    }
    try {
      await updateAdminUserApi(userId, { is_active: !currentActive }, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, is_active: !currentActive } : null));
        resetUserForm((prev) => ({ ...prev, is_active: !currentActive }));
      }
      showToast(!currentActive ? "Đã mở khóa tài khoản người dùng." : "Đã khóa tài khoản người dùng.");
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  const openUserDrawer = (user: AdminUserItem) => {
    setSelectedUser(user);
    resetUserForm({
      name: user.name,
      email: user.email,
      role: (user.role as any) || "user",
      is_active: user.is_active,
      password: "",
    });
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const closeUserDrawer = () => {
    if (drawerSaving) return;
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const handleSaveDrawer = async (data: AdminUserEditInput) => {
    if (!selectedUser) return;

    try {
      setDrawerError(null);
      const payload: any = {
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role,
        is_active: data.is_active,
      };
      if (data.password && data.password.trim()) {
        payload.password = data.password.trim();
      }

      const res = await updateAdminUserApi(selectedUser.id, payload, token);
      const updatedUser = res.data;

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updatedUser } : u))
      );
      setSelectedUser(updatedUser);
      showToast("Cập nhật thông tin tài khoản thành công!");
      resetUserForm({
        ...data,
        password: "",
      });
    } catch (err: any) {
      setFormApiErrors(err, setUserFormError, setDrawerError, "Lỗi khi lưu thông tin người dùng.");
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    if (currentUser?.id === deletingUser.id) {
      showToast("Không thể xóa tài khoản của chính bạn đang đăng nhập.", "error");
      setDeletingUser(null);
      return;
    }

    try {
      setDeleting(true);
      await deleteAdminUserApi(deletingUser.id, token);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      if (selectedUser?.id === deletingUser.id) {
        setDrawerOpen(false);
        setSelectedUser(null);
      }
      showToast(`Đã xóa tài khoản "${deletingUser.name}" vĩnh viễn.`);
      setDeletingUser(null);
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi xóa người dùng.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép: ${text}`);
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
            <ShieldCheckIcon className="h-3 w-3" />
            Admin
          </span>
        );
      case "moderator":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
            <UserCheckIcon className="h-3 w-3" />
            Mod
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300 uppercase tracking-wider">
            <UserIcon className="h-3 w-3" />
            User
          </span>
        );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* ── PAGE HERO & PRIMARY ACTIONS ── */}
      <AdminPageHeader
        title="Người Dùng & Phân Quyền"
        description="Quản lý danh sách thành viên và kiểm soát phân quyền quản trị"
      >
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
          title="Tải lại danh sách người dùng"
        >
          <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span>Làm mới</span>
        </button>
      </AdminPageHeader>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tổng Thành Viên</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {(kpiTotalUsers || meta.total).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">tài khoản</span>
          </div>
        </div>

        {/* Admins */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quản Trị Viên</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {kpiAdmins > 0 ? kpiAdmins : 1}
            </span>
            <span className="text-[11px] text-slate-500">admin</span>
          </div>
        </div>

        {/* Moderators */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Kiểm Duyệt Viên</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <UserCheckIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {kpiMods}
            </span>
            <span className="text-[11px] text-slate-500">mod</span>
          </div>
        </div>

        {/* Inactive / Banned Accounts */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] p-3.5 sm:p-4 hover:border-white/15 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bị Khóa</span>
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400">
              <UserXIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{kpiInactive}</span>
            <span className="text-[11px] text-slate-500">tài khoản</span>
          </div>
        </div>
      </div>

      {/* ── ROLE TABS & FILTERS ── */}
      <div className="flex flex-col gap-3">
        {/* Quick Role Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
          {[
            { label: "Tất cả", value: "", icon: UserIcon },
            { label: "Quản trị viên", value: "admin", icon: ShieldCheckIcon },
            { label: "Kiểm duyệt", value: "moderator", icon: UserCheckIcon },
            { label: "Thành viên", value: "user", icon: UserIcon },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = role === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setRole(tab.value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d1017] p-3 sm:p-3.5">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-white/20 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã bị khóa</option>
            </select>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── USERS CRM DATA TABLE ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d1017] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3.5">Người Dùng</th>
                <th className="py-3 px-3.5">Email</th>
                <th className="py-3 px-3.5">Vai Trò</th>
                <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5">Ngày Tham Gia</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCwIcon className="h-5 w-5 animate-spin text-accent" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserIcon className="h-6 w-6 text-slate-600" />
                      <span>Không tìm thấy người dùng nào phù hợp với bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const initials = u.name ? u.name.trim().substring(0, 2).toUpperCase() : "U";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-white/[0.02] transition group"
                    >
                      {/* Avatar + Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm group-hover:text-accent transition-colors">
                                {u.name}
                              </span>
                              {isSelf && (
                                <span className="rounded-full bg-accent/20 border border-accent/40 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono">ID: #{u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="font-mono text-xs">{u.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white transition"
                            title="Sao chép email"
                          >
                            <CopyIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Role Select Dropdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as "admin" | "moderator" | "user")}
                            className={`rounded-lg border border-white/10 bg-[#12151f] px-2.5 py-1 text-xs font-semibold text-white focus:border-accent focus:outline-none transition ${
                              isSelf ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-white/30"
                            }`}
                          >
                            <option value="user">User (Thành viên)</option>
                            <option value="moderator">Moderator (Kiểm duyệt)</option>
                            <option value="admin">Admin (Quản trị)</option>
                          </select>
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          disabled={isSelf && u.is_active}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition cursor-pointer ${
                            u.is_active
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                          } ${isSelf && u.is_active ? "opacity-60 cursor-not-allowed" : ""}`}
                          title={isSelf ? "Không thể tự khóa tài khoản" : "Bấm để đổi trạng thái"}
                        >
                          {u.is_active ? (
                            <>
                              <UnlockIcon className="h-3 w-3" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <LockIcon className="h-3 w-3" />
                              <span>Bị khóa</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4 text-white/50 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3.5 w-3.5 text-white/30" />
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDrawer(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            title="Xem chi tiết & Chỉnh sửa"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeletingUser(u)}
                            className={`p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
                            }`}
                            title={isSelf ? "Không thể xóa chính bạn" : "Xóa tài khoản vĩnh viễn"}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 p-4 bg-white/[0.01]">
            <div className="text-xs text-white/50">
              Hiển thị trang <span className="font-bold text-white">{meta.currentPage}</span> /{" "}
              <span className="font-bold text-white">{meta.lastPage}</span> (Tổng{" "}
              <strong className="text-white">{meta.total.toLocaleString()}</strong> người dùng)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={meta.currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
              >
                &larr; Trang trước
              </button>
              <button
                type="button"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
              >
                Trang sau &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── USER DETAIL SLIDE-OVER DRAWER ── */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={closeUserDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#0f121b] border-l border-white/10 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-accent/40 to-purple-500/40 border border-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      {renderRoleBadge(selectedUser.role)}
                    </h2>
                    <p className="text-[11px] text-white/50 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeUserDrawer}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleSubmit(handleSaveDrawer)} className="flex-1 overflow-y-auto p-6 space-y-5" noValidate>
                {drawerError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium">
                    {drawerError}
                  </div>
                )}

                {/* Account Overview Box */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-white/60">
                    <span>Mã định danh (User ID)</span>
                    <span className="font-mono font-bold text-white">#{selectedUser.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/60">
                    <span>Ngày tham gia</span>
                    <span className="font-mono text-white/80">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/60">
                    <span>Trạng thái tài khoản</span>
                    <span
                      className={`font-bold ${selectedUser.is_active ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {selectedUser.is_active ? "Đang hoạt động bình thường" : "Đang bị khóa"}
                    </span>
                  </div>
                </div>

                {/* Field: Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white">Họ và tên</label>
                  <input
                    type="text"
                    {...register("name")}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white backdrop-blur-sm transition focus:outline-none ${
                      userFormErrors.name
                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 bg-white/5 focus:border-accent"
                    }`}
                  />
                  {userFormErrors.name && (
                    <p className="text-xs text-red-400 font-medium">{userFormErrors.name.message}</p>
                  )}
                </div>

                {/* Field: Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white">Địa chỉ Email</label>
                  <input
                    type="email"
                    {...register("email")}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white backdrop-blur-sm transition focus:outline-none ${
                      userFormErrors.email
                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 bg-white/5 focus:border-accent"
                    }`}
                  />
                  {userFormErrors.email && (
                    <p className="text-xs text-red-400 font-medium">{userFormErrors.email.message}</p>
                  )}
                </div>

                {/* Field: Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white">Vai trò & Quyền hạn</label>
                  <select
                    {...register("role")}
                    className="w-full rounded-xl border border-white/10 bg-[#12151f] px-3.5 py-2.5 text-xs text-white focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="user">User — Thành viên xem phim thông thường</option>
                    <option value="moderator">Moderator — Kiểm duyệt phim, tập & phản hồi</option>
                    <option value="admin">Admin — Toàn quyền quản trị hệ thống</option>
                  </select>
                  {userFormErrors.role && (
                    <p className="text-xs text-red-400 font-medium">{userFormErrors.role.message}</p>
                  )}
                </div>

                {/* Field: Toggle Active */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div>
                    <div className="text-xs font-bold text-white">Trạng thái kích hoạt</div>
                    <p className="text-[10px] text-white/50">Cho phép người dùng đăng nhập và xem phim.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("is_active")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Field: Reset Password */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyIcon className="h-3.5 w-3.5 text-accent" />
                    <span>Đặt mật khẩu mới (Nếu cần reset)</span>
                  </label>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="Để trống nếu không muốn thay đổi mật khẩu..."
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-white placeholder-white/30 backdrop-blur-sm transition focus:outline-none ${
                      userFormErrors.password
                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 bg-white/5 focus:border-accent"
                    }`}
                  />
                  {userFormErrors.password ? (
                    <p className="text-xs text-red-400 font-medium">{userFormErrors.password.message}</p>
                  ) : (
                    <p className="text-[10px] text-white/40">Tối thiểu 6 ký tự.</p>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeUserDrawer}
                    disabled={drawerSaving}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={drawerSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {drawerSaving && <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />}
                    <span>{drawerSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE USER CONFIRMATION MODAL ── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f121b] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <TrashIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xóa Tài Khoản Người Dùng</h3>
                <p className="text-xs text-white/50">Hành động này sẽ xóa vĩnh viễn dữ liệu.</p>
              </div>
            </div>

            <div className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <p>
                Bạn có chắc chắn muốn xóa tài khoản{" "}
                <strong className="text-white font-bold">&ldquo;{deletingUser.name}&rdquo;</strong> (
                <span className="font-mono text-white/80">{deletingUser.email}</span>)?
              </p>
              <p className="text-red-400 font-semibold pt-1">
                ⚠️ Toàn bộ token đăng nhập, lịch sử và bình luận liên quan có thể bị ảnh hưởng.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-500/25 hover:bg-red-600 disabled:opacity-50 transition cursor-pointer"
              >
                {deleting && <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />}
                <span>{deleting ? "Đang xóa..." : "Xóa Người Dùng"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
