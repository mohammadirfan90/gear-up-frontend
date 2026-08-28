"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { loginSchema, type LoginFormValues } from "@/shared/validators/auth";
import { isSafeNextPath } from "@/shared/redirects";
import { cn } from "@/shared/utils/cn";

const dashboardPath = (role: "customer" | "provider" | "admin") => {
  if (role === "customer") return "/dashboard/customer";
  if (role === "provider") return "/dashboard/provider";
  return "/dashboard/admin";
};

const DEMO_ACCOUNTS = [
  {
    role: "Customer",
    email: "customer@gearup.com",
    password: "Customer@12345",
    tone: "hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    role: "Provider",
    email: "provider@gearup.com",
    password: "Provider@12345",
    tone: "hover:border-teal-500/50 hover:bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  {
    role: "Admin",
    email: "admin@gearup.com",
    password: "Admin@12345",
    tone: "hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");
  const reason = params.get("reason");
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const fillDemo = (email: string, pass: string, role: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
    toast.success(`Filled ${role} demo credentials`);
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      // SECURITY: validate `next` against an allowlist to prevent open-redirect
      // phishing. Anything that isn't a same-origin path falls back to the
      // role-default dashboard.
      const safeNext = isSafeNextPath(nextParam) ? nextParam : null;
      const target = safeNext ?? dashboardPath(user.role);
      router.push(target);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError("password", { type: "server", message: " " });
      toast.error(message);
    }
  };

  return (
    <>
      {reason === "expired" ? (
        <p className="mb-5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center text-[12px] text-amber-600 dark:text-amber-300">
          Your session expired. Please sign in again.
        </p>
      ) : null}

      {/* Demo Credentials Quick-Fill */}
      <div className="mb-5 rounded-xl border border-border bg-card/50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Demo Accounts (1-Click Fill)
          </span>
          <span className="text-[10px] text-muted-foreground">For evaluation</span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => fillDemo(acc.email, acc.password, acc.role)}
              className={cn(
                "flex flex-col items-center rounded-lg border border-border bg-background/80 px-2 py-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98]",
                acc.tone,
              )}
            >
              <span className="text-[12px] font-semibold">{acc.role}</span>
              <span className="text-[10px] text-muted-foreground">Click to fill</span>
            </button>
          ))}
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-xl border border-border glass-strong p-7 shadow-elevated"
      >
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@adventure.io"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your secure password"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon weight="regular" className="h-4 w-4" />
              ) : (
                <EyeIcon weight="regular" className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
          <ArrowRightIcon weight="bold" className="h-4 w-4" />
        </Button>

        <p className="text-center text-[13px] text-muted-foreground">
          New to GearUp?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </>
  );
}

function LoginSkeleton() {
  return (
    <div className="space-y-5 rounded-xl border border-border glass-strong p-7 shadow-elevated">
      <div className="h-11 w-full animate-shimmer rounded-md" />
      <div className="h-11 w-full animate-shimmer rounded-md" />
      <div className="h-11 w-full animate-shimmer rounded-md" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mask-radial-fade border-grid opacity-40"
      />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-glow">
            <GearIcon weight="fill" className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue renting premium gear.
          </p>
        </div>
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
