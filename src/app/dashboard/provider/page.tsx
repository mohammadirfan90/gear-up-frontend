"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlagBannerIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  SpinnerGapIcon,
  StorefrontIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { AddGearModal, type GearFormValues } from "@/components/AddGearModal";
import { fetchCategories, type Category } from "@/shared/categories";
import { fetchGearList, type GearSummary } from "@/shared/gear";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/provider",
    icon: StorefrontIcon,
    description: "Inventory and rental activity",
  },
  {
    label: "Orders",
    href: "/dashboard/provider/orders",
    icon: ReceiptIcon,
    description: "Manage incoming orders",
  },
  {
    label: "Profile",
    href: "/dashboard/provider/profile",
    icon: FlagBannerIcon,
    description: "Account settings",
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProviderDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const providerId = user?.id ?? "";

  const gearQuery = useQuery({
    queryKey: ["provider-gear", providerId],
    queryFn: () =>
      fetchGearList({
        providerId,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: isAuthenticated && Boolean(providerId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories-list"],
    queryFn: fetchCategories,
  });

  const gear: GearSummary[] = gearQuery.data?.items ?? [];
  const categories: Category[] = categoriesQuery.data ?? [];

  const totals = useMemo(() => {
    const available = gear.filter((item) => item.isAvailable).length;
    const unavailable = gear.length - available;
    const totalStock = gear.reduce((sum, item) => sum + Number(item.stock ?? 0), 0);
    const avgPrice =
      gear.length > 0
        ? gear.reduce((sum, item) => sum + Number(item.pricePerDay ?? 0), 0) /
          gear.length
        : 0;
    return { available, unavailable, totalStock, avgPrice };
  }, [gear]);

  const totalsCards = [
    {
      label: "Listed gear",
      value: gear.length,
      description: "Pieces in your catalogue",
      icon: PackageIcon,
      tone: "text-lime-300 bg-lime-400/10 border-lime-400/20",
    },
    {
      label: "Available now",
      value: totals.available,
      description: `${totals.unavailable} hidden from renters`,
      icon: CheckCircleIcon,
      tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    },
    {
      label: "Total stock",
      value: totals.totalStock,
      description: "Units across all listings",
      icon: StorefrontIcon,
      tone: "text-blue-300 bg-blue-400/10 border-blue-400/20",
    },
    {
      label: "Avg price / day",
      value: formatMoney(totals.avgPrice),
      description: "Across your catalogue",
      icon: ReceiptIcon,
      tone: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    },
  ];

  const [modalState, setModalState] = useState<
    | { mode: "create" }
    | ({ mode: "edit" | "delete" } & { gear: GearSummary })
    | null
  >(null);

  const openCreate = () => setModalState({ mode: "create" });
  const openEdit = (item: GearSummary) =>
    setModalState({ mode: "edit", gear: item });
  const openDelete = (item: GearSummary) =>
    setModalState({ mode: "delete", gear: item });
  const closeModal = () => setModalState(null);

  const initialValues: Partial<GearFormValues> | undefined = useMemo(() => {
    if (!modalState) return undefined;
    if (modalState.mode === "create") return undefined;
    const item = modalState.gear;
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      brand: item.brand,
      pricePerDay: Number(item.pricePerDay),
      stock: Number(item.stock ?? 0),
      isAvailable: item.isAvailable,
      images: item.images ?? [],
      categoryId: item.category.id,
    };
  }, [modalState]);

  const isLoading = gearQuery.isPending;

  return (
    <DashboardShell
      eyebrow="Provider workspace"
      title={`Welcome back, ${user?.name?.split(" ")[0] ?? "partner"}.`}
      description="Manage your catalogue, track inventory, and respond to incoming rentals."
      tabs={tabs}
      actions={
        <Button size="sm" onClick={openCreate}>
          <PlusIcon weight="bold" className="h-3.5 w-3.5" />
          Add new gear
        </Button>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {totalsCards.map(({ label, value, description, icon: Icon, tone }) => (
          <article
            key={label}
            className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 shadow-elevated transition-colors hover:border-lime-400/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {label}
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {isLoading ? "—" : value}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">{description}</p>
              </div>
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", tone)}>
                <Icon weight="duotone" className="h-5 w-5" />
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-lime-300 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
          </article>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Inventory</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {gear.length} listing{gear.length === 1 ? "" : "s"} in your catalogue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/provider/orders">
                Open orders
                <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon weight="bold" className="h-3.5 w-3.5" />
              Add gear
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : gearQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <WarningCircleIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
            <p className="text-sm font-medium text-foreground">Unable to load inventory</p>
            <button
              type="button"
              onClick={() => gearQuery.refetch()}
              className="mt-3 text-[12px] font-medium text-lime-300 hover:text-lime-200"
            >
              Try again
            </button>
          </div>
        ) : gear.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <PackageIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No gear yet</p>
            <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
              Add your first piece of gear to start receiving rental requests.
            </p>
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <PlusIcon weight="bold" className="h-3.5 w-3.5" />
              Add first gear
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="hidden w-full text-left text-[13px] md:table">
              <thead>
                <tr className="border-b border-border bg-secondary/20 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price / day</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {gear.map((item) => (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => openDelete(item)}
                  />
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-border md:hidden">
              {gear.map((item) => (
                <MobileInventoryRow
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => openDelete(item)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <AddGearModal
        open={modalState !== null}
        mode={modalState?.mode ?? "create"}
        categories={categories}
        {...(initialValues ? { initialValues } : {})}
        onClose={closeModal}
      />

      {gearQuery.isFetching && !isLoading ? (
        <div className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <SpinnerGapIcon weight="bold" className="h-3 w-3 animate-spin text-lime-400" />
          Syncing inventory…
        </div>
      ) : null}
    </DashboardShell>
  );
}

function InventoryRow({
  item,
  onEdit,
  onDelete,
}: {
  item: GearSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-secondary/30">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-12 w-16 shrink-0 rounded-md border border-border bg-cover bg-center"
            style={{
              backgroundImage: item.images?.[0]
                ? `url(${item.images[0]})`
                : "linear-gradient(135deg, #111114, #1f1f23)",
            }}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{item.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {item.brand}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-muted-foreground">{item.category.name}</td>
      <td className="px-5 py-4 tabular-nums text-foreground">
        {formatMoney(Number(item.pricePerDay))}
      </td>
      <td className="px-5 py-4 tabular-nums text-foreground">
        {Number(item.stock ?? 0)}
      </td>
      <td className="px-5 py-4">
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold",
            item.isAvailable
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-400/30 bg-rose-500/10 text-rose-300",
          )}
        >
          {item.isAvailable ? "Available" : "Hidden"}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2.5 text-[11px]"
          >
            <PencilIcon weight="bold" className="h-3 w-3" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 px-2.5 text-[11px] text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <TrashIcon weight="bold" className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

function MobileInventoryRow({
  item,
  onEdit,
  onDelete,
}: {
  item: GearSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="h-12 w-16 shrink-0 rounded-md border border-border bg-cover bg-center"
          style={{
            backgroundImage: item.images?.[0]
              ? `url(${item.images[0]})`
              : "linear-gradient(135deg, #111114, #1f1f23)",
          }}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{item.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.category.name} · {formatMoney(Number(item.pricePerDay))} · stock {item.stock}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2 text-[11px]">
          <PencilIcon weight="bold" className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 px-2 text-[11px] text-rose-300 hover:bg-rose-500/10"
        >
          <TrashIcon weight="bold" className="h-3 w-3" />
        </Button>
      </div>
    </article>
  );
}
