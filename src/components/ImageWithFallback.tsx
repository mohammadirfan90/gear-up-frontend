"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";

interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
  src?: ImageProps["src"] | null;
  fallbackClassName?: string;
  fallbackLabel?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackLabel = "Image unavailable",
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const isPlaceholder =
    typeof src === "string" &&
    (src.includes("example.com") || src.includes("placeholder.com") || (!src.startsWith("http") && !src.startsWith("/")));

  if (!src || failed || isPlaceholder) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel}
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-card to-secondary/70 text-muted-foreground",
          fallbackClassName,
        )}
      >
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-[11px] backdrop-blur">
          <ImageIcon weight="duotone" className="h-3.5 w-3.5" />
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return <Image {...props} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export default ImageWithFallback;
