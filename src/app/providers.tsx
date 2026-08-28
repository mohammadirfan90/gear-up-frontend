"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, useTheme } from "next-themes";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const baseBg = isDark ? "#09090b" : "#ffffff";
  const baseColor = isDark ? "#ffffff" : "#0a0a0a";
  const baseBorder = isDark ? "#1f1f23" : "#e4e4e7";
  const baseShadow = isDark
    ? "0 10px 30px -12px rgba(0,0,0,0.6)"
    : "0 10px 30px -12px rgba(10,10,10,0.18)";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: baseBg,
          color: baseColor,
          border: `1px solid ${baseBorder}`,
          fontSize: "0.875rem",
          borderRadius: "10px",
          padding: "12px 16px",
          boxShadow: baseShadow,
        },
        success: {
          iconTheme: {
            primary: isDark ? "#99ea48" : "#487f17",
            secondary: isDark ? "#000000" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#0a0a0a" : "#ffffff",
          },
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
