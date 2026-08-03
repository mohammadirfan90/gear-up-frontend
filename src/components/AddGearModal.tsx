"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  PackageIcon,
  PlusIcon,
  SpinnerGapIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { cn } from "@/shared/utils/cn";
import {
  createProviderGear,
  deleteProviderGear,
  updateProviderGear,
  type CreateGearPayload,
  type UpdateGearPayload,
} from "@/shared/providerGear";
import { type Category } from "@/shared/categories";

type Mode = "create" | "edit" | "delete";

export interface GearFormValues {
  id?: string;
  name: string;
  description: string;
  brand: string;
  pricePerDay: number;
  stock: number;
  isAvailable: boolean;
  images: string[];
  specifications?: Record<string, string>;
  categoryId: string;
}

export interface AddGearModalProps {
  open: boolean;
  mode: Mode;
  categories: Category[];
  initialValues?: Partial<GearFormValues>;
  onClose: () => void;
}

const EMPTY_FORM: GearFormValues = {
  name: "",
  description: "",
  brand: "",
  pricePerDay: 0,
  stock: 1,
  isAvailable: true,
  images: [],
  specifications: {},
  categoryId: "",
};

export function AddGearModal({
  open,
  mode,
  categories,
  initialValues,
  onClose,
}: AddGearModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GearFormValues>(EMPTY_FORM);
  const [imageDraft, setImageDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setImageDraft("");
      setTouched(false);
      setConfirmDelete(false);
      return;
    }
    setForm({ ...EMPTY_FORM, ...initialValues });
  }, [open, initialValues]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmDelete) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, confirmDelete]);

  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  const createMutation = useMutation({
    mutationFn: (payload: CreateGearPayload) => createProviderGear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-gear"] });
      queryClient.invalidateQueries({ queryKey: ["gear"] });
      queryClient.invalidateQueries({ queryKey: ["featured-gear"] });
      toast.success("Gear listed");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "Unable to create gear"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateGearPayload) =>
      updateProviderGear(form.id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-gear"] });
      queryClient.invalidateQueries({ queryKey: ["gear"] });
      queryClient.invalidateQueries({ queryKey: ["gear", form.id] });
      queryClient.invalidateQueries({ queryKey: ["featured-gear"] });
      toast.success("Gear updated");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "Unable to update gear"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProviderGear(form.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-gear"] });
      queryClient.invalidateQueries({ queryKey: ["gear"] });
      queryClient.invalidateQueries({ queryKey: ["featured-gear"] });
      toast.success("Gear removed");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "Unable to delete gear"),
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const validation = useMemo(() => validateGearForm(form), [form]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!validation.isValid) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      pricePerDay: Number(form.pricePerDay),
      stock: Number(form.stock),
      isAvailable: form.isAvailable,
      images: form.images,
      specifications: form.specifications,
      categoryId: form.categoryId,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddImage = () => {
    const value = imageDraft.trim();
    if (!value) return;
    if (form.images.includes(value)) {
      toast.error("Image already added");
      return;
    }
    if (form.images.length >= 20) {
      toast.error("You can add up to 20 images");
      return;
    }
    try {
      new URL(value);
    } catch {
      toast.error("Image URL must be a valid link");
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, value] }));
    setImageDraft("");
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, current) => current !== index),
    }));
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate();
  };

  if (!open) return null;

  if (isDelete) {
    return (
      <DeleteConfirmShell
        gearName={form.name}
        isMutating={isMutating}
        confirmDelete={confirmDelete}
        onClose={onClose}
        onDelete={handleDelete}
      />
    );
  }

  const fieldClass = "space-y-5";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-gear-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10"
    >
      <button
        type="button"
        aria-label="Close gear form"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card glass-strong shadow-elevated animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10 text-lime-300">
              <PackageIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
                {isEdit ? "Edit gear" : "Add new gear"}
              </p>
              <h2
                id="add-gear-modal-title"
                className="mt-1 text-lg font-semibold tracking-tight text-foreground"
              >
                {isEdit ? form.name || "Untitled gear" : "List a new piece of gear"}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {isEdit
                  ? "Update availability, pricing, and media for this listing."
                  : "Fill in the essentials — renters will see these details on your gear page."}
              </p>
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

        <form
          onSubmit={handleSubmit}
          className={cn("flex-1 space-y-5 overflow-y-auto px-6 py-6", fieldClass)}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="gear-name">
              <Input
                id="gear-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Salomon Quest 4 GTX"
                invalid={touched && !form.name.trim()}
                maxLength={200}
              />
            </Field>
            <Field label="Brand" htmlFor="gear-brand">
              <Input
                id="gear-brand"
                value={form.brand}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
                placeholder="e.g. Salomon"
                invalid={touched && !form.brand.trim()}
                maxLength={100}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="gear-description"
            hint="At least 10 characters. Highlight fit, condition, and use cases."
          >
            <textarea
              id="gear-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={4}
              maxLength={2000}
              placeholder="Lightweight, waterproof, broken-in for multi-day treks…"
              className={cn(
                "min-h-28 w-full resize-y rounded-md border border-input bg-secondary/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                touched && !form.description.trim() && "border-destructive",
              )}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Price per day"
              htmlFor="gear-price"
              hint="USD"
            >
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="gear-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number.isFinite(form.pricePerDay) ? form.pricePerDay : 0}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pricePerDay: Number(event.target.value),
                    })
                  }
                  className="pl-7 tabular-nums"
                  invalid={touched && (form.pricePerDay <= 0 || form.pricePerDay > 100000)}
                />
              </div>
            </Field>
            <Field label="Stock" htmlFor="gear-stock">
              <Input
                id="gear-stock"
                type="number"
                min={0}
                max={10000}
                step={1}
                value={Number.isFinite(form.stock) ? form.stock : 0}
                onChange={(event) =>
                  setForm({ ...form, stock: Number(event.target.value) })
                }
                className="tabular-nums"
              />
            </Field>
            <Field label="Category" htmlFor="gear-category">
              <select
                id="gear-category"
                value={form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, categoryId: event.target.value })
                }
                className={cn(
                  "flex h-11 w-full rounded-md border border-input bg-secondary/30 px-3.5 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  touched && !form.categoryId && "border-destructive",
                )}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Image URLs"
            htmlFor="gear-image-url"
            hint="Paste a public image link, then press Add. Up to 20 images."
          >
            <div className="flex items-center gap-2">
              <Input
                id="gear-image-url"
                value={imageDraft}
                onChange={(event) => setImageDraft(event.target.value)}
                placeholder="https://images.example.com/gear.jpg"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddImage}
                disabled={!imageDraft.trim()}
              >
                <PlusIcon weight="bold" className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {form.images.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {form.images.map((image, index) => (
                  <li
                    key={`${image}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-[12px]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="h-7 w-10 shrink-0 rounded border border-border bg-cover bg-center"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                      <span className="truncate text-muted-foreground">{image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:text-rose-300"
                    >
                      <TrashIcon weight="bold" className="h-3 w-3" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[12px] text-muted-foreground">
                Add at least one image to feature in the gear gallery.
              </p>
            )}
          </Field>

          <Field label="Availability" htmlFor="gear-available">
            <label
              htmlFor="gear-available"
              className="flex cursor-pointer items-center justify-between rounded-md border border-input bg-secondary/30 px-3.5 py-3 text-sm text-foreground transition-colors hover:bg-secondary/50"
            >
              <span>
                <span className="block text-[13px] font-medium">
                  List as available
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Disable to hide this gear from the marketplace temporarily.
                </span>
              </span>
              <input
                id="gear-available"
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setForm({ ...form, isAvailable: event.target.checked })
                }
                className="h-4 w-4 rounded border-input bg-secondary/40 text-lime-400 focus-visible:ring-2 focus-visible:ring-lime-300/40"
              />
            </label>
          </Field>

          {touched && !validation.isValid ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              <WarningCircleIcon weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validation.message}</span>
            </div>
          ) : null}
        </form>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border bg-secondary/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isMutating}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={(event) => {
              const formEl = (event.currentTarget.closest("[role=dialog]") as HTMLElement)
                ?.querySelector("form");
              if (formEl instanceof HTMLFormElement) {
                formEl.requestSubmit();
              }
            }}
            disabled={isMutating}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" />
                {isEdit ? "Saving…" : "Publishing…"}
              </>
            ) : (
              <>
                <CheckCircleIcon weight="bold" className="h-4 w-4" />
                {isEdit ? "Save changes" : "Publish gear"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmShell({
  gearName,
  isMutating,
  confirmDelete,
  onClose,
  onDelete,
}: {
  gearName: string;
  isMutating: boolean;
  confirmDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-gear-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-destructive/40 bg-card glass-strong shadow-elevated animate-fade-in-up">
        <div className="flex items-start gap-3 border-b border-destructive/30 bg-destructive/5 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 text-destructive">
            <WarningCircleIcon weight="duotone" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-destructive">
              Caution
            </p>
            <h2
              id="delete-gear-title"
              className="mt-1 text-lg font-semibold tracking-tight text-foreground"
            >
              Delete this listing?
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              You’re about to delete{" "}
              <span className="font-semibold text-foreground">{gearName}</span>.
              This will hide it from the marketplace and cancel any pending
              reservations.
            </p>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5 text-[12px] text-muted-foreground">
          <p>• Existing rentals will not be refunded automatically.</p>
          <p>• Reviews on this gear will remain but the listing will be removed.</p>
          <p>• This action cannot be undone.</p>
        </div>
        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border bg-secondary/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isMutating}>
            Keep listing
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isMutating}
          >
            {isMutating ? (
              <>
                <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : confirmDelete ? (
              <>Confirm delete</>
            ) : (
              <>
                <TrashIcon weight="bold" className="h-4 w-4" />
                Delete listing
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function validateGearForm(form: GearFormValues): { isValid: boolean; message?: string } {
  if (!form.name.trim()) return { isValid: false, message: "Name is required." };
  if (form.name.trim().length < 2)
    return { isValid: false, message: "Name must be at least 2 characters." };
  if (!form.brand.trim()) return { isValid: false, message: "Brand is required." };
  if (!form.description.trim() || form.description.trim().length < 10)
    return {
      isValid: false,
      message: "Description must be at least 10 characters.",
    };
  if (form.pricePerDay <= 0 || form.pricePerDay > 100000)
    return { isValid: false, message: "Price must be between $1 and $100,000." };
  if (!form.categoryId) return { isValid: false, message: "Pick a category." };
  if (form.stock < 0 || form.stock > 10000)
    return { isValid: false, message: "Stock must be between 0 and 10,000." };
  if (form.images.length === 0)
    return { isValid: false, message: "Add at least one image URL." };
  return { isValid: true };
}

export default AddGearModal;