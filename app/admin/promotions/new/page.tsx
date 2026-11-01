"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Megaphone,
  Image as ImageIcon,
  Save,
  Loader2,
  CalendarDays,
  Link as LinkIcon,
  Upload,
  X,
} from "lucide-react";

export default function NewPromotionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    discount_label: "",
    button_text: "Shop Now",
    button_url: "/products",
    starts_at: "",
    ends_at: "",
    is_active: true,
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const updateField = (
    field: keyof typeof form,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Please enter a promotion title.");
      return;
    }

    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.ends_at) <= new Date(form.starts_at)
    ) {
      setError("The expiry date must be after the start date.");
      return;
    }

    setLoading(true);

    let uploadedImagePath: string | null = null;

    try {
      let imageUrl: string | null = null;

      // Upload selected image to Supabase Storage
      if (imageFile) {
        const fileExtension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `promotions/${crypto.randomUUID()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("promotion-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`
          );
        }

        uploadedImagePath = filePath;

        const { data: publicUrlData } = supabase.storage
          .from("promotion-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      // Save promotion details
      const { error: insertError } = await supabase
        .from("promotions")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          discount_label: form.discount_label.trim() || null,
          image_url: imageUrl,
          button_text: form.button_text.trim() || "Shop Now",
          button_url: form.button_url.trim() || "/products",
          starts_at: form.starts_at
            ? new Date(form.starts_at).toISOString()
            : null,
          ends_at: form.ends_at
            ? new Date(form.ends_at).toISOString()
            : null,
          is_active: form.is_active,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/admin/promotions");
      router.refresh();
    } catch (err) {
      console.error("Promotion creation error:", err);

      // Remove uploaded image if promotion creation fails
      if (uploadedImagePath) {
        await supabase.storage
          .from("promotion-images")
          .remove([uploadedImagePath]);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the promotion."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#142d4e]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => router.push("/admin/promotions")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-medium text-gray-400">
              SONAMA WILLS / Marketing / Promotions
            </p>

            <h1 className="mt-1 text-2xl font-extrabold">
              Create Promotion
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Promotion Details */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                <Megaphone size={21} />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Promotion Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Give your campaign a name and description.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Promotion Title *
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  placeholder="e.g. Mega Summer Electronics Sale"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1769e0]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Describe this promotion to your customers..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1769e0]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Discount Label
                </label>

                <input
                  value={form.discount_label}
                  onChange={(e) =>
                    updateField("discount_label", e.target.value)
                  }
                  placeholder="e.g. 25% OFF or LIMITED OFFER"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
                />
              </div>
            </div>
          </section>

          {/* Promotion Image */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                <ImageIcon size={21} />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Promotion Banner
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Select an image from your device.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {!imagePreview ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center transition hover:border-[#1769e0] hover:bg-blue-50/40">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-[#1769e0]">
                    <Upload size={25} />
                  </div>

                  <p className="text-sm font-bold">
                    Click to select an image
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, WEBP or other image formats
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Maximum file size: 5MB
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Promotion preview"
                    className="h-64 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-md transition hover:bg-red-50"
                    aria-label="Remove selected image"
                  >
                    <X size={19} />
                  </button>

                  <div className="bg-white px-4 py-3">
                    <p className="truncate text-sm font-bold">
                      {imageFile?.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {imageFile
                        ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {imagePreview && (
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold transition hover:bg-gray-50">
                  <Upload size={16} />
                  Change Image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </section>

          {/* Call to Action */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                <LinkIcon size={21} />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Call to Action
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Decide where customers go when they click.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Button Text
                </label>

                <input
                  value={form.button_text}
                  onChange={(e) =>
                    updateField("button_text", e.target.value)
                  }
                  placeholder="Shop Now"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Destination URL
                </label>

                <input
                  value={form.button_url}
                  onChange={(e) =>
                    updateField("button_url", e.target.value)
                  }
                  placeholder="/products"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
                />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                <CalendarDays size={21} />
              </div>

              <div>
                <h2 className="font-extrabold">
                  Promotion Schedule
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Control when your promotion becomes visible.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Start Date
                </label>

                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    updateField("starts_at", e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Expiry Date
                </label>

                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) =>
                    updateField("ends_at", e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
                />
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <p className="text-sm font-bold">
                  Activate Promotion
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Make this promotion eligible to appear in the store.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateField("is_active", e.target.checked)
                }
                className="h-5 w-5 accent-[#1769e0]"
              />
            </label>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/admin/promotions")}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1255b9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading & Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Promotion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}