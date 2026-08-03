"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  MagnifyingGlassIcon,
  SpinnerGapIcon,
  UserCircleIcon,
  UsersIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import {
  fetchAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserListParams,
} from "@/shared/admin";

interface UsersTableProps {
  currentUserId?: string;
}

const LIMIT = 12;

const ROLE_TONE: Record<string, string> = {
  customer: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  provider: "border-lime-400/30 bg-lime-400/10 text-lime-300",
  admin: "border-violet-400/30 bg-violet-500/10 text-violet-300",
};

const STATUS_TONE: Record<string, string> = {
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  suspended: "border-rose-400/30 bg-rose-500/10 text-rose-300",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export function UsersTable({ currentUserId }: UsersTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState<"" | "customer" | "provider" | "admin">("");
  const [status, setStatus] = useState<"" | "active" | "suspended">("");

  const buildParams = (): AdminUserListParams => ({
    page,
    limit: LIMIT,
    ...(debounced ? { search: debounced } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", buildParams()],
    queryFn: () => fetchAdminUsers(buildParams()),
    placeholderData: (previous) => previous,
  });

  const items = usersQuery.data?.items ?? [];
  const pagination = usersQuery.data?.pagination;

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: "active" | "suspended" }) =>
      updateAdminUserStatus(input.id, input.status),
    onSuccess: (user) => {
      toast.success(
        `${user.name} marked as ${user.status === "active" ? "active" : "suspended"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to update user status"),
  });

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDebounced(search.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebounced("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  return (
    <section className="space-y-5">
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon
            weight="bold"
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-md border border-input bg-secondary/30 pl-9 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Search users"
          />
        </div>
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as typeof role);
            setPage(1);
          }}
          aria-label="Filter by role"
          className="h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {(debounced || role || status) ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
          >
            Reset
          </Button>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card/60">
        {usersQuery.isPending ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : usersQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
            <p className="text-sm font-medium text-foreground">
              Unable to load users
            </p>
            <button
              type="button"
              onClick={() => usersQuery.refetch()}
              className="mt-3 text-[12px] font-medium text-lime-300 hover:text-lime-200"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <UsersIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No users match</p>
            <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
              Try a different search term or clear the filters.
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_140px_140px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:grid">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-border">
              {items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  isMutating={
                    statusMutation.isPending &&
                    statusMutation.variables?.id === user.id
                  }
                  onToggleStatus={() =>
                    statusMutation.mutate({
                      id: user.id,
                      status: user.status === "active" ? "suspended" : "active",
                    })
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {pagination ? (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPrev={() => setPage((value) => Math.max(1, value - 1))}
          onNext={() =>
            setPage((value) =>
              pagination.hasNext ? value + 1 : value,
            )
          }
          disabled={usersQuery.isFetching}
        />
      ) : null}
    </section>
  );
}

function UserRow({
  user,
  isSelf,
  isMutating,
  onToggleStatus,
}: {
  user: AdminUser;
  isSelf: boolean;
  isMutating: boolean;
  onToggleStatus: () => void;
}) {
  const isAdmin = user.role === "admin";
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[minmax(0,1fr)_140px_120px_140px_140px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold text-foreground">
          {initials || <UserCircleIcon weight="duotone" className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">
            {user.name}
            {isSelf ? (
              <span className="ml-2 rounded-md border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-300">
                You
              </span>
            ) : null}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div>
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold capitalize",
            ROLE_TONE[user.role] ?? "border-border bg-secondary/40 text-muted-foreground",
          )}
        >
          {user.role}
        </span>
      </div>

      <div>
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold capitalize",
            STATUS_TONE[user.status] ?? "border-border bg-secondary/40 text-muted-foreground",
          )}
        >
          {user.status}
        </span>
      </div>

      <div className="text-[12px] text-muted-foreground">{formatDate(user.createdAt)}</div>

      <div className="flex items-center justify-start gap-2 md:justify-end">
        {isAdmin ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <WarningCircleIcon weight="bold" className="h-3 w-3" />
            Admin accounts are protected
          </span>
        ) : isSelf ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <WarningCircleIcon weight="bold" className="h-3 w-3" />
            Cannot modify your own status
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant={user.status === "active" ? "outline" : "default"}
            className="h-8 px-2.5 text-[11px]"
            onClick={onToggleStatus}
            disabled={isMutating}
          >
            {isMutating ? (
              <SpinnerGapIcon weight="bold" className="h-3 w-3 animate-spin" />
            ) : user.status === "active" ? (
              <XCircleIcon weight="bold" className="h-3 w-3" />
            ) : (
              <CheckCircleIcon weight="bold" className="h-3 w-3" />
            )}
            {user.status === "active" ? "Suspend" : "Activate"}
          </Button>
        )}
      </div>
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  disabled,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
}) {
  if (totalPages <= 1 && total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-[12px] text-muted-foreground">
      <span>
        Page {page} of {Math.max(1, totalPages)} · {total.toLocaleString()} user
        {total === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onPrev}
          disabled={page <= 1 || disabled}
          className="h-8 px-2.5 text-[11px]"
        >
          <ArrowLeftIcon weight="bold" className="h-3 w-3" />
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNext}
          disabled={page >= totalPages || disabled}
          className="h-8 px-2.5 text-[11px]"
        >
          Next
          <ArrowRightIcon weight="bold" className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default UsersTable;
