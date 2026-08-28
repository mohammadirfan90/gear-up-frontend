"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/shared/apiError";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  MinusIcon,
  PlusIcon,
  SparkleIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns";
import {
  computeRentalDays,
  isDateInReservedRanges,
  rangeOverlapsReserved,
  toDateInput,
  type DateRange,
} from "@/shared/utils/date";
import {
  createRentalOrder,
  fetchOccupiedDates,
  type RentalOrder,
} from "@/shared/rentals";

interface BookingCardProps {
  gearId: string;
  pricePerDay: number;
  stock: number;
  isAvailable: boolean;
}

export function BookingCard({
  gearId,
  pricePerDay: rawPricePerDay,
  stock,
  isAvailable,
}: BookingCardProps) {
  const pricePerDay = Number(rawPricePerDay || 0);
  const router = useRouter();
  const today = startOfToday();
  const calendarRef = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState(today);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"start" | "end">("start");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const occupiedQuery = useQuery({
    queryKey: ["gear-occupied-dates", gearId],
    queryFn: () => fetchOccupiedDates(gearId),
    staleTime: 30_000,
  });

  const availability = occupiedQuery.data;
  const reserved: DateRange[] = availability?.dates ?? [];
  // Prefer the live "available today" figure from the server (total stock
  // minus units currently rented and overlapping today). Fall back to the
  // static `stock` prop until the first response arrives or if the request
  // fails — the latter is already announced by the amber inline message below.
  const availableToday = availability?.availableToday;
  const effectiveStock = availableToday ?? stock;
  const days = computeRentalDays(startDate, endDate);
  const total = pricePerDay * quantity * days;
  const rangeInvalid = Boolean(
    startDate && endDate && rangeOverlapsReserved(startDate, endDate, reserved),
  );

  // Close calendar popover on click outside
  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
        setHoverDate(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  const orderMutation = useMutation<RentalOrder, Error, void>({
    mutationFn: () => {
      if (!startDate || !endDate || rangeInvalid) {
        throw new Error("Choose an available rental date range.");
      }
      return createRentalOrder({
        gearItemId: gearId,
        startDate,
        endDate,
        quantity,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (order) => {
      toast.success("Rental request created");
      router.push(`/dashboard/customer/orders/${order.id}/pay`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Unable to create rental request")),
  });

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const handleDateClick = (date: Date) => {
    const value = toDateInput(date);
    if (isDateInReservedRanges(date, reserved)) return;

    if (activeSegment === "start" || !startDate) {
      setStartDate(value);
      setEndDate("");
      setActiveSegment("end");
      return;
    }

    if (activeSegment === "end") {
      const parsedStart = parseISO(startDate);
      if (isBefore(date, parsedStart)) {
        // If clicked date is before start, treat as new start date
        setStartDate(value);
        setEndDate("");
        setActiveSegment("end");
        return;
      }

      // Check if selected range overlaps any occupied dates
      if (rangeOverlapsReserved(startDate, value, reserved)) {
        toast.error("Range crosses unavailable dates. Please choose another return date.");
        return;
      }

      setEndDate(value);
      setActiveSegment("start");
      setCalendarOpen(false);
      setHoverDate(null);
    }
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setHoverDate(null);
    setActiveSegment("start");
  };

  const applyPreset = (durationDays: number) => {
    const base = startDate ? parseISO(startDate) : today;
    const startCandidate = isBefore(base, today) ? today : base;
    const endCandidate = addDays(startCandidate, durationDays);

    const sStr = toDateInput(startCandidate);
    const eStr = toDateInput(endCandidate);

    if (rangeOverlapsReserved(sStr, eStr, reserved)) {
      toast.error("Preset crosses unavailable dates.");
      return;
    }

    setStartDate(sStr);
    setEndDate(eStr);
    setMonth(startCandidate);
    setCalendarOpen(false);
    setHoverDate(null);
  };

  const minQuantity = 1;
  const maxQuantity = Math.max(1, effectiveStock);
  const outOfStock = effectiveStock <= 0;
  const bookable = isAvailable && !outOfStock;

  return (
    <div className="rounded-xl border border-border glass-strong p-6 shadow-elevated">
      {/* Price Header */}
      <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Rent for
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            ${pricePerDay.toFixed(0)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ day</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", effectiveStock > 0 ? "bg-emerald-500" : "bg-destructive")} />
          {effectiveStock} available now
        </span>
      </div>

      {/* Dual Segmented Date Picker */}
      <div className="relative mt-5" ref={calendarRef}>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rental Dates
        </label>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-secondary/30 transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
          {/* Pickup Segment */}
          <button
            type="button"
            onClick={() => {
              setActiveSegment("start");
              setCalendarOpen(true);
            }}
            className={cn(
              "flex flex-col items-start px-3.5 py-2.5 text-left transition-colors",
              calendarOpen && activeSegment === "start"
                ? "bg-primary/10 text-foreground"
                : "hover:bg-secondary/60",
            )}
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarBlankIcon weight="bold" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Pickup
            </span>
            <span className="mt-0.5 truncate text-[13px] font-medium text-foreground">
              {startDate ? format(parseISO(startDate), "MMM d, yyyy") : "Add date"}
            </span>
          </button>

          {/* Return Segment */}
          <button
            type="button"
            onClick={() => {
              setActiveSegment("end");
              setCalendarOpen(true);
            }}
            className={cn(
              "flex flex-col items-start border-l border-border px-3.5 py-2.5 text-left transition-colors",
              calendarOpen && activeSegment === "end"
                ? "bg-primary/10 text-foreground"
                : "hover:bg-secondary/60",
            )}
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowRightIcon weight="bold" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Return
            </span>
            <span className="mt-0.5 truncate text-[13px] font-medium text-foreground">
              {endDate ? format(parseISO(endDate), "MMM d, yyyy") : "Add date"}
            </span>
          </button>
        </div>

        {/* Selected Duration Pill */}
        {startDate && endDate && (
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              ✓ {days} day{days === 1 ? "" : "s"} rental selected
            </span>
            <button
              type="button"
              onClick={handleClearDates}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}

        {/* Popover Calendar with Solid Background (No Bleed Through) */}
        {calendarOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-xl border border-border bg-card p-4 shadow-2xl animate-fade-in-up">
            {/* Popover Header Prompt */}
            <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <p className="text-[12px] font-semibold text-foreground">
                  {activeSegment === "start" || !startDate
                    ? "Select pickup date"
                    : "Select return date"}
                </p>
                {activeSegment === "end" && startDate ? (
                  <p className="text-[10px] text-muted-foreground">
                    Pickup: {format(parseISO(startDate), "MMM d, yyyy")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close calendar"
              >
                <XIcon weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
                }
                disabled={isSameMonth(month, today)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-20"
                aria-label="Previous month"
              >
                <CaretLeftIcon weight="bold" className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-semibold text-foreground">
                {format(month, "MMMM yyyy")}
              </span>
              <button
                type="button"
                onClick={() =>
                  setMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Next month"
              >
                <CaretRightIcon weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                <span key={`${day}-${idx}`}>{day}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((date) => {
                const value = toDateInput(date);
                const past = isBefore(date, today);
                const occupied = isDateInReservedRanges(date, reserved);
                const outside = !isSameMonth(date, month);

                const isStart = value === startDate;
                const isEnd = value === endDate;
                const isSelected = isStart || isEnd;

                // Active committed range
                const inRange =
                  Boolean(startDate && endDate) &&
                  isWithinInterval(date, {
                    start: parseISO(startDate),
                    end: parseISO(endDate),
                  });

                // Real-time hover preview range
                const effectiveHoverEnd =
                  activeSegment === "end" && startDate && hoverDate && hoverDate >= startDate
                    ? hoverDate
                    : null;

                const inHoverRange =
                  Boolean(effectiveHoverEnd) &&
                  isWithinInterval(date, {
                    start: parseISO(startDate),
                    end: parseISO(effectiveHoverEnd!),
                  });

                const disabled = past || occupied || outside;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => !disabled && setHoverDate(value)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={cn(
                      "relative flex h-8 items-center justify-center text-[11px] font-medium transition-all",
                      outside && "pointer-events-none opacity-0",
                      past && "cursor-not-allowed text-muted-foreground/30",
                      occupied && "cursor-not-allowed text-destructive/70 line-through",
                      !disabled && !isSelected && !inRange && !inHoverRange && "rounded-md text-foreground hover:bg-secondary",

                      // Ribbon highlighting
                      (inRange || inHoverRange) && !isSelected && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                      isStart && endDate && "rounded-l-md rounded-r-none bg-emerald-500 font-bold text-white dark:bg-emerald-400 dark:text-slate-950",
                      isEnd && "rounded-r-md rounded-l-none bg-emerald-500 font-bold text-white dark:bg-emerald-400 dark:text-slate-950",
                      isSelected && !endDate && "rounded-md bg-emerald-500 font-bold text-white dark:bg-emerald-400 dark:text-slate-950",
                    )}
                  >
                    {date.getDate()}
                    {occupied && !outside && (
                      <span className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-destructive" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets Bar */}
            <div className="mt-3.5 border-t border-border pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "2 Days", days: 2 },
                  { label: "3 Days", days: 3 },
                  { label: "1 Week", days: 7 },
                  { label: "2 Weeks", days: 14 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.days)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:border-emerald-500/50 hover:bg-secondary"
                  >
                    <SparkleIcon weight="fill" className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Legend & Clear Button */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  Selected
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" />
                  Unavailable
                </span>
              </div>
              {startDate && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                >
                  <ClockCounterClockwiseIcon weight="bold" className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {rangeInvalid ? (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-destructive">
          <WarningCircleIcon weight="fill" className="h-3.5 w-3.5" />
          These dates overlap an existing rental.
        </p>
      ) : null}

      {/* Quantity Selector */}
      <div className="mt-5 flex items-center justify-between rounded-md border border-border bg-secondary/20 px-3.5 py-2.5">
        <span className="text-[13px] text-muted-foreground">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(minQuantity, value - 1))}
            disabled={quantity <= minQuantity}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <MinusIcon weight="bold" className="h-3 w-3" />
          </button>
          <span className="w-4 text-center text-sm font-medium text-foreground">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            disabled={quantity >= maxQuantity}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <PlusIcon weight="bold" className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-foreground">
          Notes <span className="text-[11px] font-normal text-muted-foreground">optional</span>
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          placeholder="Anything we should know for pickup?"
          className="min-h-20 resize-y rounded-md border border-input bg-secondary/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      {/* Pricing Summary */}
      <div className="mt-5 space-y-2 border-t border-border pt-5 text-[13px]">
        <div className="flex justify-between text-muted-foreground">
          <span>
            ${pricePerDay.toFixed(0)} × {quantity} unit{quantity === 1 ? "" : "s"} × {days || 0} day{days === 1 ? "" : "s"}
          </span>
          <span className="text-foreground">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-foreground">
          <span>Total before taxes</span>
          <span className="text-emerald-600 dark:text-emerald-400">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        type="button"
        size="lg"
        className="mt-5 w-full"
        disabled={
          !bookable ||
          !startDate ||
          !endDate ||
          rangeInvalid ||
          orderMutation.isPending ||
          occupiedQuery.isLoading
        }
        onClick={() => orderMutation.mutate()}
      >
        {orderMutation.isPending ? (
          <>
            <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" /> Creating request...
          </>
        ) : outOfStock ? (
          <>Out of stock</>
        ) : !startDate || !endDate ? (
          <>Select rental dates</>
        ) : (
          <>
            Rent now <CheckCircleIcon weight="bold" className="h-4 w-4" />
          </>
        )}
      </Button>

      {!isAvailable ? (
        <p className="mt-2 text-center text-[11px] text-destructive">
          This item is currently unavailable.
        </p>
      ) : outOfStock ? (
        <p className="mt-2 text-center text-[11px] text-destructive">
          Every unit is currently out on rental.
        </p>
      ) : null}
      {occupiedQuery.isError ? (
        <p className="mt-2 text-center text-[11px] text-amber-300">
          Availability dates could not be refreshed. Please verify before booking.
        </p>
      ) : null}
    </div>
  );
}

export default BookingCard;
