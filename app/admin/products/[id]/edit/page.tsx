"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
ArrowLeft,
ImagePlus,
Loader2,
Package,
Save,
X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProductForm = {
name: string;
slug: string;
sku: string;
category: string;
description: string;
price: string;
stock_quantity: string;
image_url: string;
is_active: boolean;
is_featured: boolean;
};

const emptyForm: ProductForm = {
name: "",
slug: "",
sku: "",
category: "",
description: "",
price: "",
stock_quantity: "0",
image_url: "",
is_active: true,
is_featured: false,
};

export default function EditProductPage() {
const router = useRouter();
const params = useParams<{ id: string }>();
const productId = params.id;

const [form, setForm] = useState<ProductForm>(emptyForm);
const [userId, setUserId] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [uploading, setUploading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState("");

const loadProduct = useCallback(async () => {
setLoading(true);
setError("");


try {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    router.replace("/admin/login");
    return;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    router.replace("/admin/login");
    return;
  }

  setUserId(user.id);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      "id, name, slug, sku, category, description, price, stock_quantity, image_url, is_active, is_featured"
    )
    .eq("id", productId)
    .maybeSingle();

  if (productError) throw new Error(productError.message);

  if (!product) {
    setError("This product could not be found.");
    return;
  }

  setForm({
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    price: String(product.price ?? ""),
    stock_quantity: String(product.stock_quantity ?? 0),
    image_url: product.image_url ?? "",
    is_active: product.is_active ?? true,
    is_featured: product.is_featured ?? false,
  });

  setImagePreview(product.image_url ?? "");
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to load this product."
  );
} finally {
  setLoading(false);
}


}, [productId, router]);

useEffect(() => {
void loadProduct();
}, [loadProduct]);

useEffect(() => {
if (!imageFile) return;


const objectUrl = URL.createObjectURL(imageFile);
setImagePreview(objectUrl);

return () => URL.revokeObjectURL(objectUrl);


}, [imageFile]);

function updateField<K extends keyof ProductForm>(
key: K,
value: ProductForm[K]
) {
setForm((current) => ({ ...current, [key]: value }));
}

async function uploadImage(): Promise<string> {
if (!imageFile) return form.image_url;


const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || !uploadPreset) {
  throw new Error("Cloudinary environment variables are missing.");
}

setUploading(true);

try {
  const body = new FormData();
  body.append("file", imageFile);
  body.append("upload_preset", uploadPreset);
  body.append("folder", "sonama-wills/products");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result.error?.message || "Could not upload the new image."
    );
  }

  return result.secure_url as string;
} finally {
  setUploading(false);
}


}

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setError("");
setSuccess("");


if (!userId) {
  setError("Your admin session has expired. Please log in again.");
  return;
}

const price = Number(form.price);
const stock = Number(form.stock_quantity);

if (!form.name.trim() || !form.category.trim()) {
  setError("Product name and category are required.");
  return;
}

if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
  setError("Enter a valid product price.");
  return;
}

if (
  form.stock_quantity.trim() === "" ||
  !Number.isInteger(stock) ||
  stock < 0
) {
  setError("Stock must be a whole number of zero or more.");
  return;
}

const slug =
  form.name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || form.slug;

setSaving(true);

try {
  const imageUrl = await uploadImage();
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from("products")
    .update({
      name: form.name.trim(),
      slug,
      sku: form.sku.trim() || null,
      category: form.category.trim(),
      description: form.description.trim(),
      price,
      stock_quantity: stock,
      image_url: imageUrl || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
    })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);

  setSuccess("Product updated successfully.");

  window.setTimeout(() => {
    router.push("/admin/products");
    router.refresh();
  }, 700);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Unable to update this product."
  );
} finally {
  setSaving(false);
}


}

if (loading) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#fafafa]"> <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-[#142d4e] shadow-sm"> <Loader2 size={22} className="animate-spin text-[#1769e0]" /> <span className="text-sm font-semibold">Loading product...</span> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#fafafa] text-[#142d4e]"> <header className="border-b border-gray-200 bg-white"> <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8"> <div> <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
SONAMA WILLS / Inventory </p> <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
Edit Product </h1> <p className="mt-1 text-sm text-gray-500">
Update product details, pricing, and available stock. </p> </div>


      <Link
        href="/admin/products"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold hover:bg-gray-50"
      >
        <ArrowLeft size={17} />
        <span className="hidden sm:inline">Back to Products</span>
        <span className="sm:hidden">Back</span>
      </Link>
    </div>
  </header>

  <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    {error && (
      <div
        role="alert"
        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
      >
        {error}
      </div>
    )}

    {success && (
      <div
        role="status"
        className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      >
        {success}
      </div>
    )}

    {error === "This product could not be found." ? (
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-5 py-3 text-sm font-bold text-white"
      >
        <ArrowLeft size={17} />
        Return to Products
      </Link>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
              <Package size={22} />
            </div>
            <div>
              <h2 className="font-extrabold">Product Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the product's details.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">
                Product Name *
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Category *
              </span>
              <select
                required
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Select category</option>
                <option value="Televisions">Televisions</option>
                <option value="Washing Machines">Washing Machines</option>
                <option value="Refrigerators & Freezers">
                  Refrigerators & Freezers
                </option>
                <option value="Air Conditioners">Air Conditioners</option>
                <option value="Audio">Audio</option>
                <option value="Kitchen Appliances">Kitchen Appliances</option>
                <option value="Small Appliances">Small Appliances</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">SKU</span>
              <input
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Price (₦) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Stock Quantity *
              </span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                onChange={(e) =>
                  updateField("stock_quantity", e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">Description</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-extrabold">Product Image</h2>
          <p className="mt-1 text-sm text-gray-500">
            Keep the current image or select a replacement.
          </p>

          {imagePreview && (
            <div className="mt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Current product"
                className="h-44 w-44 rounded-xl border border-gray-100 bg-white object-contain p-2"
              />
            </div>
          )}

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#fafafa] p-6 text-center hover:border-blue-300 hover:bg-blue-50/40">
            <ImagePlus size={27} className="mb-3 text-[#1769e0]" />
            <span className="text-sm font-bold">
              {imageFile ? imageFile.name : "Choose replacement image"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              PNG, JPG or WEBP · Maximum 10MB
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;

                if (file && file.size > 10 * 1024 * 1024) {
                  setError("Choose an image smaller than 10MB.");
                  e.target.value = "";
                  return;
                }

                setError("");
                setImageFile(file);
              }}
            />
          </label>

          {imageFile && (
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600"
            >
              <X size={15} />
              Remove replacement image
            </button>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 font-extrabold">Visibility & Promotion</h2>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1769e0]"
              />
              <span>
                <span className="block text-sm font-bold">Active product</span>
                <span className="mt-1 block text-xs text-gray-500">
                  Make this product available in your store.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  updateField("is_featured", e.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[#1769e0]"
              />
              <span>
                <span className="block text-sm font-bold">
                  Featured product
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Highlight this product in your catalogue.
                </span>
              </span>
            </label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || uploading || !userId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1255b9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving || uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {uploading
              ? "Uploading image..."
              : saving
                ? "Saving changes..."
                : "Save Changes"}
          </button>
        </div>
      </form>
    )}
  </div>
</main>


);
}
