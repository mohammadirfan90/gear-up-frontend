"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CreditCardIcon,
  PackageIcon,
  ShoppingBagOpenIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/shared/validators/auth";
import { updateMyProfile } from "@/shared/profile";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/apiError";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/customer",
    icon: ShoppingBagOpenIcon,
    description: "Rental activity at a glance",
  },
  {
    label: "Orders",
    href: "/dashboard/customer/orders",
    icon: PackageIcon,
    description: "Track your rental history",
  },
  {
    label: "Payments",
    href: "/dashboard/customer/payments",
    icon: CreditCardIcon,
    description: "Invoices and transactions",
  },
  {
    label: "Profile",
    href: "/dashboard/customer/profile",
    icon: UserCircleIcon,
    description: "Personal settings",
  },
];

const formatDate = (value: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return formatter.format(new Date(value));
};

export default function CustomerProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  // Re-seed the form whenever the authenticated user changes (e.g. after login
  // or after `setUser` propagates a successful update). Without this the form
  // would keep stale defaults from the previous render.
  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    try {
      const updated = await updateMyProfile({
        name: values.name,
        email: values.email,
      });
      setUser(updated);
      toast.success("Profile updated");
      reset({ name: updated.name, email: updated.email });
      router.refresh();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (field === "name" || field === "email") {
            setError(field, { type: "server", message });
          }
        }
      }
      toast.error(getApiErrorMessage(err, "Unable to update your profile."));
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <DashboardShell
        eyebrow="Customer workspace"
        title="Your profile"
        tabs={tabs}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/customer">
              Back to overview
              <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <section className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-card/60 px-6 py-16 text-center shadow-elevated">
          <UserCircleIcon weight="duotone" className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Sign in to view your profile</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            You need to be signed in to edit your profile details.
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      eyebrow="Customer workspace"
      title="Your profile"
      description="Update your name and email. These details appear on your orders and rental history."
      tabs={tabs}
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/customer">
            Back to overview
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-border bg-card/60 p-6 shadow-elevated">
          <header className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCircleIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Account details</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Changes save instantly to your account.
              </p>
            </div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <Field
              label="Full name"
              htmlFor="name"
              error={errors.name?.message}
            >
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your full name"
                invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@adventure.io"
                invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => reset({ name: user.name, email: user.email })}
                disabled={isSubmitting || !isDirty}
              >
                Discard changes
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving..." : "Save changes"}
                <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-glow">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize text-foreground">{user.role}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  {user.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Member since</span>
                <span className="text-foreground">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <CalendarBlankIcon weight="bold" className="h-3 w-3" />
              Quick links
            </div>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              <Link
                href="/dashboard/customer/orders"
                className="inline-flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground transition-colors hover:border-border/80 hover:bg-secondary/60"
              >
                View your orders
                <ArrowRightIcon weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                href="/dashboard/customer/payments"
                className="inline-flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground transition-colors hover:border-border/80 hover:bg-secondary/60"
              >
                Payment history
                <ArrowRightIcon weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
