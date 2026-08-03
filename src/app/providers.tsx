"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";

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
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#09090b",
            color: "#ffffff",
            border: "1px solid #1f1f23",
            fontSize: "0.875rem",
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow: "0 10px 30px -12px rgba(0,0,0,0.6)",
          },
          success: {
            iconTheme: {
              primary: "#99ea48",
              secondary: "#000000",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#0a0a0a",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
