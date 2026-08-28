"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/shared/apiError";
import {
  CheckCircleIcon,
  SparkleIcon,
  SpinnerGapIcon,
  StarIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import { createReview, type ReviewRecord } from "@/shared/reviews";

const RATING_LABELS: Record<number, string> = {
  1: "Disappointing",
  2: "Just okay",
  3: "Solid",
  4: "Great",
  5: "Loved it",
};

const RATING_TONE = "text-amber-300";

export interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  rentalOrderId: string;
  gearName?: string;
  gearImage?: string;
  orderShortId?: string;
  onSubmitted?: (review: ReviewRecord) => void;
}

export function ReviewModal({
  open,
  onClose,
  rentalOrderId,
  gearName,
  gearImage,
  orderShortId,
  onSubmitted,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setHoverRating(0);
      setComment("");
      setTouched(false);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const trimmedComment = comment.trim();
  const ratingError = touched && rating < 1 ? "Please choose a rating from 1 to 5 stars." : null;
  const commentError =
    touched && trimmedComment.length > 1000
      ? "Comments must be 1000 characters or fewer."
      : null;

  const reviewMutation = useMutation<ReviewRecord, Error, void>({
    mutationFn: () =>
      createReview({
        rentalOrderId,
        rating,
        comment: trimmedComment || undefined,
      }),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ["rental-order", rentalOrderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["gear-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["gear"] });
      queryClient.invalidateQueries({ queryKey: ["featured-gear"] });
      toast.success("Thanks for your review!");
      onSubmitted?.(review);
      router.refresh();
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit your review"));
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (rating < 1) return;
    if (trimmedComment.length > 1000) return;
    reviewMutation.mutate();
  };

  const activeRating = hoverRating || rating;
  const ratingLabel = useMemo(
    () => (activeRating ? RATING_LABELS[activeRating] : "Tap a star to rate"),
    [activeRating],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-12"
    >
      <button
        type="button"
        aria-label="Close review modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card glass-strong shadow-elevated animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SparkleIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Share your experience
              </p>
              <h2
                id="review-modal-title"
                className="mt-1 text-lg font-semibold tracking-tight text-foreground"
              >
                {gearName ? `How was the ${gearName}?` : "How was your rental?"}
              </h2>
              {orderShortId ? (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Order #{orderShortId}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <XIcon weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {gearImage ? (
          <div className="border-b border-border bg-secondary/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-14 w-20 shrink-0 rounded-md border border-border bg-cover bg-center"
                style={{ backgroundImage: `url(${gearImage})` }}
              />
              <p className="truncate text-[13px] font-medium text-foreground">
                {gearName}
              </p>
            </div>
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-6 px-6 py-6">
          <fieldset>
            <legend className="flex items-center justify-between text-[13px] font-medium text-foreground">
              Your rating
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                required
              </span>
            </legend>

            <div
              className="mt-4 flex items-center gap-1.5"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((index) => {
                const filled = index <= activeRating;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setRating(index);
                      setTouched(true);
                    }}
                    onMouseEnter={() => setHoverRating(index)}
                    onFocus={() => setHoverRating(index)}
                    aria-label={`Rate ${index} ${index === 1 ? "star" : "stars"}`}
                    aria-pressed={rating === index}
                    className={cn(
                      "group relative inline-flex h-12 w-12 items-center justify-center rounded-md border border-transparent transition-all",
                      "hover:border-amber-300/30 hover:bg-amber-300/5",
                      "focus-visible:border-amber-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40",
                      filled && "border-amber-300/30 bg-amber-300/10 shadow-glow",
                    )}
                  >
                    <StarIcon
                      weight={filled ? "fill" : "regular"}
                      className={cn(
                        "h-7 w-7 transition-colors",
                        filled ? RATING_TONE : "text-muted-foreground/40",
                        "group-hover:scale-110",
                      )}
                    />
                    {filled ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-md bg-amber-300/10 blur-md"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span
                className={cn(
                  "font-medium",
                  activeRating ? "text-amber-300" : "text-muted-foreground",
                )}
              >
                {ratingLabel}
              </span>
              {ratingError ? (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <WarningCircleIcon weight="bold" className="h-3 w-3" />
                  {ratingError}
                </span>
              ) : null}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="review-comment"
              className="flex items-center justify-between text-[13px] font-medium text-foreground"
            >
              Comments
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                optional
              </span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={1000}
              rows={5}
              placeholder="Tell other adventurers what you loved (or what could be better)."
              className={cn(
                "min-h-32 resize-y rounded-md border border-input bg-secondary/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                commentError && "border-destructive focus-visible:ring-destructive/30",
              )}
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                Share details about fit, condition, and the experience.
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  trimmedComment.length > 950 ? "text-amber-300" : "text-muted-foreground",
                )}
              >
                {trimmedComment.length}/1000
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-[12px] text-muted-foreground">
            <CheckCircleIcon weight="duotone" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <p>
              Reviews are public. Once submitted, they appear on the gear’s page and contribute to its overall star rating.
            </p>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={reviewMutation.isPending || rating < 1}
            >
              {reviewMutation.isPending ? (
                <>
                  <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" />
                  Submitting review…
                </>
              ) : (
                <>
                  <StarIcon weight="fill" className="h-4 w-4" />
                  Submit review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
