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
      className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/20 bg-black/60 p-1.5 shadow-2xl backdrop-blur-md transition-colors focus-within:border-emerald-400/50"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <MagnifyingGlassIcon
          weight="bold"
          className="h-4 w-4 shrink-0 text-white/60"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bikes, tents, kayaks…"
          className="h-10 w-full bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 px-4 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02]"
      >
        Browse
        <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
