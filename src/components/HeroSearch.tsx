"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/gear?search=${encodeURIComponent(q)}` : "/gear");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-xl border border-border glass-strong p-1.5 shadow-elevated"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <MagnifyingGlassIcon
          weight="bold"
          className="h-4 w-4 shrink-0 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bikes, tents, kayaks…"
          className="h-10 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-br from-lime-300 via-lime-400 to-lime-500 px-4 text-sm font-semibold text-black shadow-glow transition-transform hover:scale-[1.02]"
      >
        Browse
        <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
