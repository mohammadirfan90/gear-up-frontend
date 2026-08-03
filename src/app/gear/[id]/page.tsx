import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  StarIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { fetchGearById, fetchGearReviews, type GearDetail, type GearReview } from "@/shared/gear";
import { GearGallery } from "@/components/GearGallery";
import { BookingCard } from "@/components/BookingCard";

interface GearDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GearDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const gear = await fetchGearById(id);
    return {
      title: gear.name,
      description: gear.description.slice(0, 160),
      openGraph: {
        title: `${gear.name} — GearUp`,
        description: gear.description.slice(0, 160),
        type: "website",
        siteName: "GearUp",
        images: gear.images?.[0] ? [{ url: gear.images[0] }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${gear.name} — GearUp`,
        description: gear.description.slice(0, 160),
        images: gear.images?.[0] ? [gear.images[0]] : undefined,
      },
      alternates: {
        canonical: `/gear/${id}`,
      },
    };
  } catch {
    return {
      title: "Gear details",
      description: "View specifications, pricing, and availability for this piece of gear.",
    };
  }
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const humanizeKey = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (value) => value.toUpperCase());

function RatingStars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          weight={index < Math.round(rating) ? "fill" : "regular"}
          className={`${size} ${index < Math.round(rating) ? "text-amber-300" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: GearReview }) {
  const initials = review.customer.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <article className="border-b border-border py-6 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold text-foreground">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{review.customer.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</p>
            </div>
            <RatingStars rating={review.rating} size="h-3.5 w-3.5" />
          </div>
          <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{review.comment}</p>
        </div>
      </div>
    </article>
  );
}

function DetailView({ gear, reviews }: { gear: GearDetail; reviews: GearReview[] }) {
  const specifications = gear.specifications
    ? Object.entries(gear.specifications).filter(([, value]) => value !== null && value !== "")
    : [];
  const average = gear.avgRating ?? 0;

  return (
    <div className="container mx-auto max-w-7xl px-6 py-10 sm:py-14">
      <Link
        href="/gear"
        className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
        Back to all gear
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0">
          <GearGallery images={gear.images} name={gear.name} />
          <div className="mt-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-lime-400/30 bg-lime-400/5 px-2.5 py-1 text-[11px] font-medium text-lime-300">
                {gear.category.name}
              </span>
              <span className="rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {gear.brand}
              </span>
              {gear.isAvailable ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  In stock
                </span>
              ) : null}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {gear.name}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{gear.description}</p>
          </div>

          <section className="mt-12 border-t border-border pt-8">
            <div className="mb-6 flex items-center gap-3">
              <PackageIcon weight="duotone" className="h-5 w-5 text-lime-400" />
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Specifications</h2>
            </div>
            {specifications.length > 0 ? (
              <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
                {specifications.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-4 border-b border-border bg-card/50 px-4 py-3.5 text-[13px] last:border-b-0 sm:nth-[odd]:border-r">
                    <dt className="text-muted-foreground">{humanizeKey(key)}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-lg border border-border bg-card/50 px-4 py-5 text-sm text-muted-foreground">
                Specifications will be added by the provider soon.
              </p>
            )}
          </section>

          <section className="mt-12 border-t border-border pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <StarIcon weight="fill" className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Reviews</h2>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {reviews.length > 0 ? `${gear.reviewCount} verified rental reviews` : "Be the first to share your experience."}
                </p>
              </div>
              {reviews.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-foreground">{average.toFixed(1)}</span>
                  <div>
                    <RatingStars rating={average} size="h-3 w-3" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Average rating</p>
                  </div>
                </div>
              ) : null}
            </div>
            {reviews.length > 0 ? (
              <div>{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
            ) : (
              <div className="rounded-lg border border-border bg-card/50 px-5 py-6 text-center">
                <p className="text-sm font-medium text-foreground">No reviews yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Rent this gear and tell the community how it performed.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingCard
            gearId={gear.id}
            pricePerDay={gear.pricePerDay}
            stock={gear.stock}
            isAvailable={gear.isAvailable}
          />

          <div className="mt-4 rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
                <UserCircleIcon weight="duotone" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Listed by</p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{gear.provider.name}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-lime-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  Verified provider
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[12px] text-muted-foreground">
              <MapPinIcon weight="duotone" className="h-3.5 w-3.5" />
              Pickup details shared after booking
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <ShieldCheckIcon weight="duotone" className="h-3.5 w-3.5" />
              Verified and protected
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default async function GearDetailPage({ params }: GearDetailPageProps) {
  const { id } = await params;

  const [gear, reviewsResult] = await Promise.allSettled([
    fetchGearById(id),
    fetchGearReviews(id),
  ]);

  if (gear.status !== "fulfilled") {
    notFound();
  }

  const reviews: GearReview[] =
    reviewsResult.status === "fulfilled" ? reviewsResult.value.items : [];

  return <DetailView gear={gear.value} reviews={reviews} />;
}
