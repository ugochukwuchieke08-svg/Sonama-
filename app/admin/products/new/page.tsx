"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
sku: string;
category: string;
brand: string;
description: string;
price: string;
stock_quantity: string;
image_url: string;
is_active: boolean;
is_featured: boolean;
};

const initialForm: ProductForm = {
name: "",
sku: "",
category: "",
brand: "",
description: "",
price: "",
stock_quantity: "1",
image_url: "",
is_active: true,
is_featured: false,
};

export default function NewProductPage() {
const router = useRouter();
const supabase = createClient();

const [form, setForm] = useState<ProductForm>(initialForm);
const [brands, setBrands] = useState<
  { id: string; name: string; categories: string[] }[]
>([]);
const [loadingBrands, setLoadingBrands] = useState(true);

const [userId, setUserId] = useState<string | null>(null);
const [checkingAuth, setCheckingAuth] = useState(true);
const [saving, setSaving] = useState(false);
const [uploading, setUploading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState("");

useEffect(() => {
  async function fetchBrands() {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, categories")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      setBrands(data ?? []);
    } catch (err) {
      console.error("Failed to load brands:", err);
      setError("Could not load brands. Please refresh the page.");
    } finally {
      setLoadingBrands(false);
    }
  }

  fetchBrands();
}, [supabase]);

useEffect(() => {
let mounted = true;


async function checkAdmin() {
  try {
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

    if (mounted) setUserId(user.id);
  } catch {
    router.replace("/admin/login");
  } finally {
    if (mounted) setCheckingAuth(false);
  }
}

checkAdmin();

return () => {
  mounted = false;
};


}, [router, supabase]);

useEffect(() => {
if (!imageFile) {
setImagePreview("");
return;
}


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
if (!imageFile) return form.image_url.trim();


const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || !uploadPreset) {
  throw new Error(
    "Cloudinary is not configured. Check your .env.local variables."
  );
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
      result.error?.message || "Image upload failed. Try another image."
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
  setError("Your admin session could not be verified. Please log in again.");
  return;
}

const price = Number(form.price);
const stock = Number(form.stock_quantity);

if (!form.name.trim()) {
  setError("Enter the product name.");
  return;
}

if (!form.category.trim()) {
  setError("Enter the product category.");
  return;
}

if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
  setError("Enter a valid product price.");
  return;
}

if (
  !form.stock_quantity.trim() ||
  !Number.isInteger(stock) ||
  stock < 0
) {
  setError("Stock quantity must be a whole number of zero or more.");
  return;
}

setSaving(true);

try {
  const imageUrl = await uploadImage();

  const slug = form.name
  .trim()
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const { error: insertError } = await supabase.from("products").insert({
  name: form.name.trim(),
  slug,
  sku: form.sku.trim() || null,
  category: form.category.trim(),
  brand: form.brand,
  description: form.description.trim(),
  price,
  stock_quantity: stock,
  image_url: imageUrl || null,
  is_active: form.is_active,
  is_featured: form.is_featured,
});

  if (insertError) {
    throw new Error(insertError.message);
  }

  setSuccess("Product added successfully.");

  window.setTimeout(() => {
    router.push("/admin/products");
    router.refresh();
  }, 800);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Something went wrong while saving the product."
  );
} finally {
  setSaving(false);
}


}

if (checkingAuth) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#fafafa] text-[#142d4e]"> <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm"> <Loader2 className="animate-spin text-[#1769e0]" size={22} /> <span className="text-sm font-semibold">Verifying admin access...</span> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#fafafa] text-[#142d4e]"> <header className="border-b border-gray-200 bg-white"> <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8"> <div> <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
SONAMA WILLS / Inventory </p> <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
Add Product </h1> <p className="mt-1 text-sm text-gray-500">
Add a product to your store inventory. </p> </div>

      <Link
        href="/admin/products"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-gray-50"
      >
        <ArrowLeft size={17} />
        <span className="hidden sm:inline">Back to Products</span>
        <span className="sm:hidden">Back</span>
      </Link>
    </div>
  </header>

  <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
            <Package size={22} />
          </div>
          <div>
            <h2 className="font-extrabold">Product Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the basic details of your product.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold">
              Product Name <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Samsung 55-inch Smart TV"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Category <span className="text-red-500">*</span>
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
          <span className="mb-2 block text-sm font-bold">
            Brand <span className="text-red-500">*</span>
          </span>

          <select
            required
            value={form.brand}
            onChange={(e) => updateField("brand", e.target.value)}
            disabled={!form.category || loadingBrands}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {loadingBrands
                ? "Loading brands..."
                : !form.category
                  ? "Select a category first"
                  : "Select brand"}
            </option>

            {brands
              .filter(
                (brand) =>
                  brand.categories.includes(form.category)
              )
              .map((brand) => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
          </select>
        </label>


          <label className="block">
            <span className="mb-2 block text-sm font-bold">SKU</span>
            <input
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              placeholder="e.g. SAM-TV-001"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Price (₦) <span className="text-red-500">*</span>
            </span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="250000"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">
              Stock Quantity <span className="text-red-500">*</span>
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
            <span className="mb-2 block text-sm font-bold">
              Description
            </span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              placeholder="Describe the product, its features and specifications..."
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <h2 className="font-extrabold">Product Image</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose an image to upload to Cloudinary.
          </p>
        </div>

        <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#fafafa] p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-40 w-40 rounded-xl bg-white object-contain p-2"
              />
              <span className="mt-3 block max-w-xs truncate text-xs font-semibold text-gray-500">
                {imageFile?.name}
              </span>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1769e0]">
                <ImagePlus size={27} />
              </div>
              <span className="text-sm font-bold">Choose product image</span>
              <span className="mt-1 text-xs text-gray-500">
                PNG, JPG or WEBP
              </span>
            </>
          )}

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
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            <X size={15} />
            Remove image
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
              <span className="mt-1 block text-xs leading-5 text-gray-500">
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
              <span className="block text-sm font-bold">Featured product</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">
                Mark this product as featured in your catalogue.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold transition hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving || uploading || checkingAuth || !userId}
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
              ? "Saving product..."
              : "Save Product"}
        </button>
      </div>
    </form>
  </div>
</main>


);
}
