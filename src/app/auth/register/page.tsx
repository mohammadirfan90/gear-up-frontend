"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  GearIcon,
  ShoppingBagOpenIcon,
  StorefrontIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { registerSchema, type RegisterFormValues } from "@/shared/validators/auth";
import { cn } from "@/shared/utils/cn";

const ROLE_OPTIONS = [
  {
    value: "customer" as const,
    title: "Customer",
    description: "Rent premium gear for your next adventure.",
    Icon: ShoppingBagOpenIcon,
  },
  {
    value: "provider" as const,
    title: "Provider",
    description: "List your inventory and earn from rentals.",
    Icon: StorefrontIcon,
  },
] as const;

const dashboardPath = (role: "customer" | "provider" | "admin") => {
  if (role === "customer") return "/dashboard/customer";
  if (role === "provider") return "/dashboard/provider";
  return "/dashboard/admin";
};

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "customer",
    },
  });

  const password = watch("password") ?? "";
  const selectedRole = watch("role");

  const passwordChecks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Contains a letter", passed: /[a-zA-Z]/.test(password) },
    { label: "Contains a number", passed: /\d/.test(password) },
  ];

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const user = await registerUser(values);
      toast.success("Welcome to GearUp!", {
        icon: "🎉",
      });
      router.push(dashboardPath(user.role));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      toast.error(message);
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mask-radial-fade border-grid opacity-40"
      />
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lime-300 via-lime-400 to-lime-500 text-black shadow-glow">
            <GearIcon weight="fill" className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join GearUp and unlock premium gear rentals.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 rounded-xl border border-border glass-strong p-7 shadow-elevated"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map(({ value, title, description, Icon }) => {
              const active = selectedRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value, { shouldValidate: true })}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    active
                      ? "border-lime-400/60 bg-lime-400/5 shadow-glow"
                      : "border-border bg-secondary/30 hover:border-border/80 hover:bg-secondary/60",
                  )}
                  aria-pressed={active}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      active
                        ? "bg-lime-400/20 text-lime-300"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon weight="duotone" className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                  <span className="text-[12px] leading-relaxed text-muted-foreground">
                    {description}
                  </span>
                  {active ? (
                    <CheckCircleIcon
                      weight="fill"
                      className="absolute right-3 top-3 h-4 w-4 text-lime-400"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("role")} />
          {errors.role?.message ? (
            <p className="-mt-3 text-[12px] text-destructive">{errors.role.message}</p>
          ) : null}

          <Field label="Full name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Alex Rivera"
              invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>

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

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint="Use at least 8 characters with a mix of letters and numbers."
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
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
            {password && !errors.password ? (
              <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-3">
                {passwordChecks.map((check) => (
                  <li
                    key={check.label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
                      check.passed
                        ? "border-lime-400/30 bg-lime-400/5 text-lime-300"
                        : "border-border bg-secondary/30 text-muted-foreground",
                    )}
                  >
                    <CheckCircleIcon
                      weight="fill"
                      className={cn(
                        "h-3 w-3",
                        check.passed ? "text-lime-400" : "text-muted-foreground",
                      )}
                    />
                    {check.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create account"}
            <ArrowRightIcon weight="bold" className="h-4 w-4" />
          </Button>

          <p className="text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheckIcon weight="regular" className="h-3 w-3" />
            Protected by industry-standard encryption.
          </p>
        </form>
      </div>
    </div>
  );
}
