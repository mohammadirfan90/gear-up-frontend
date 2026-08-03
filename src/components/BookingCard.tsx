"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CalendarBlankIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
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
  pricePerDay,
  stock,
  isAvailable,
}: BookingCardProps) {
  const router = useRouter();
  const today = startOfToday();
  const [month, setMonth] = useState(today);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const occupiedQuery = useQuery({
    queryKey: ["gear-occupied-dates", gearId],
    queryFn: () => fetchOccupiedDates(gearId),
    staleTime: 30_000,
  });

  const reserved: DateRange[] = occupiedQuery.data ?? [];
  const days = computeRentalDays(startDate, endDate);
  const total = pricePerDay * quantity * days;
  const rangeInvalid = Boolean(
    startDate && endDate && rangeOverlapsReserved(startDate, endDate, reserved),
  );

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
    onError: (error) => toast.error(error.message || "Unable to create rental request"),
  });

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const chooseDate = (date: Date) => {
    const value = toDateInput(date);
    if (isDateInReservedRanges(date, reserved)) return;

    if (!startDate || selectingEnd) {
      if (startDate && isBefore(date, parseISO(startDate))) {
        setStartDate(value);
        setEndDate("");
        setSelectingEnd(true);
        return;
      }
      setEndDate(value);
      setSelectingEnd(false);
      setCalendarOpen(false);
      return;
    }

    setStartDate(value);
    setEndDate("");
    setSelectingEnd(true);
  };

  const minQuantity = 1;
  const maxQuantity = Math.max(1, stock);

  return (
    <div className="rounded-xl border border-border glass-strong p-6 shadow-elevated">
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
        <span className="text-[12px] text-muted-foreground">
          {stock} available
        </span>
      </div>

      <div className="relative mt-5">
        <button
          type="button"
          onClick={() => setCalendarOpen((open) => !open)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border bg-secondary/30 px-3.5 py-3 text-left transition-colors hover:bg-secondary/60",
            rangeInvalid ? "border-destructive" : "border-input",
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarBlankIcon weight="duotone" className="h-4 w-4 text-lime-400" />
            <span className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Rental dates
              </span>
              <span className="mt-0.5 text-sm text-foreground">
                {startDate && endDate
                  ? `${format(parseISO(startDate), "MMM d")} – ${format(parseISO(endDate), "MMM d, yyyy")}`
                  : "Select your dates"}
              </span>
            </span>
          </span>
          <CaretDownIcon
            weight="bold"
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              calendarOpen && "rotate-180",
            )}
          />
        </button>

        {calendarOpen ? (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-lg border border-border glass-strong p-4 shadow-elevated animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
                disabled={isSameMonth(month, today)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                aria-label="Previous month"
              >
                <CaretLeftIcon weight="bold" className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm font-semibold text-foreground">{format(month, "MMMM yyyy")}</span>
              <button
                type="button"
                onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Next month"
              >
                <CaretRightIcon weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const value = toDateInput(date);
                const past = isBefore(date, today);
                const occupied = isDateInReservedRanges(date, reserved);
                const outside = !isSameMonth(date, month);
                const selected = value === startDate || value === endDate;
                const inRange = startDate && endDate && isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={past || occupied || outside}
                    onClick={() => chooseDate(date)}
                    className={cn(
                      "relative flex h-8 items-center justify-center rounded-md text-[11px] transition-colors",
                      outside && "opacity-0",
                      past && "cursor-not-allowed text-muted-foreground/30",
                      occupied && "cursor-not-allowed text-destructive/70 line-through",
                      !past && !occupied && !outside && "text-foreground hover:bg-secondary",
                      inRange && "rounded-none bg-lime-400/10 text-lime-200",
                      selected && "rounded-md bg-lime-400 font-semibold text-black hover:bg-lime-300",
                    )}
                  >
                    {date.getDate()}
                    {occupied && !outside ? <span className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-destructive" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lime-400" /> Selected</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/70" /> Unavailable</span>
            </div>
          </div>
        ) : null}
      </div>

      {rangeInvalid ? (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-destructive">
          <WarningCircleIcon weight="fill" className="h-3.5 w-3.5" />
          These dates overlap an existing rental.
        </p>
      ) : null}

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

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-foreground">Notes <span className="text-[11px] font-normal text-muted-foreground">optional</span></span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          placeholder="Anything we should know?"
          className="min-h-20 resize-y rounded-md border border-input bg-secondary/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <div className="mt-5 space-y-2 border-t border-border pt-5 text-[13px]">
        <div className="flex justify-between text-muted-foreground">
          <span>${pricePerDay.toFixed(0)} × {quantity} × {days || 0} day{days === 1 ? "" : "s"}</span>
          <span className="text-foreground">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-foreground">
          <span>Total before taxes</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="mt-5 w-full"
        disabled={!isAvailable || !startDate || !endDate || rangeInvalid || orderMutation.isPending || occupiedQuery.isLoading}
        onClick={() => orderMutation.mutate()}
      >
        {orderMutation.isPending ? (
          <><SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" /> Creating request...</>
        ) : (
          <>Rent now <CheckCircleIcon weight="bold" className="h-4 w-4" /></>
        )}
      </Button>
      {!isAvailable ? (
        <p className="text-center text-[11px] text-destructive">This item is currently unavailable.</p>
      ) : null}
      {occupiedQuery.isError ? (
        <p className="text-center text-[11px] text-amber-300">Availability dates could not be refreshed. Please verify before booking.</p>
      ) : null}
    </div>
  );
}

export default BookingCard;
