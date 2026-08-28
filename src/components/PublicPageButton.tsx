import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";

interface PublicPageButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function PublicPageButton({
  href,
  label = "View public page",
  className,
}: PublicPageButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary",
        className,
      )}
    >
      {label}
      <ArrowUpRightIcon weight="bold" className="h-3 w-3" />
    </Link>
  );
}

export default PublicPageButton;
