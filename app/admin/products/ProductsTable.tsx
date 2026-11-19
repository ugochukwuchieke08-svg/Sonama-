"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock3,
  Pencil,
  ArrowUpRight,
  Package,
} from "lucide-react";

import DeleteProductButton from "./DeleteProductButton";
import { updateProductReview } from "./action";

type Product = {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  reviewed_at: string | null;
};

export default function ProductsTable({
  products,
}: {
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [reviewFilter, setReviewFilter] = useState("All");
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const router = useRouter();

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ).sort() as string[],
    [products]
  );

  const reviewedCount = products.filter((p) => p.reviewed_at).length;
  const remainingCount = products.length - reviewedCount;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
  .filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.sku || "").toLowerCase().includes(query) ||
      (product.category || "").toLowerCase().includes(query);

    const matchesCategory =
      category === "All categories" ||
      product.category === category;

    const matchesReview =
      reviewFilter === "All" ||
      (reviewFilter === "Reviewed" && !!product.reviewed_at) ||
      (reviewFilter === "Not reviewed" && !product.reviewed_at);

    return matchesSearch && matchesCategory && matchesReview;
  })
  .sort((a, b) => {
    // Unreviewed products always appear first.
    return Number(!!a.reviewed_at) - Number(!!b.reviewed_at);
  });
  }, [products, search, category, reviewFilter]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(price);

  function toggleReviewed(product: Product) {
    setUpdatingId(product.id);

    startTransition(async () => {
      const result = await updateProductReview(
        product.id,
        !product.reviewed_at
      );

      setUpdatingId(null);

      if (!result.success) {
        alert(result.error || "Unable to update review status.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Search and filters */}
      <div className="space-y-5 border-b border-gray-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#142d4e]">
              Product Inventory
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {products.length} products in your database
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1769e0]">
            {reviewedCount} of {products.length} reviewed
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-2 flex justify-between text-xs font-semibold text-gray-500">
            <span>Review progress</span>
            <span>
              {products.length
                ? Math.round((reviewedCount / products.length) * 100)
                : 0}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  products.length
                    ? (reviewedCount / products.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

     <div className="space-y-3">
  {/* Search bar and category filter */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search product name, SKU or category..."
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
      />
    </div>

    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1769e0]"
    >
      <option>All categories</option>
      {categories.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  </div>

  {/* Review filters */}
  <div className="flex flex-wrap gap-2">
    {[
      { label: `All (${products.length})`, value: "All" },
      { label: `To Review (${remainingCount})`, value: "Not reviewed" },
      { label: `Reviewed (${reviewedCount})`, value: "Reviewed" },
    ].map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => setReviewFilter(item.value)}
        className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          reviewFilter === item.value
            ? "bg-[#1769e0] text-white"
            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
</div>

        <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {reviewedCount} reviewed
          </span>

          <span className="flex items-center gap-1.5">
            <Clock3 size={15} className="text-amber-500" />
            {remainingCount} remaining
          </span>

          <span>
            Showing {filteredProducts.length} products
          </span>
        </div>
      </div>

      {/* Products table */}
      {filteredProducts.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Package size={32} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-bold text-[#142d4e]">
            No matching products
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try another product name, SKU or filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-[#f8faff] text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Review</th>
                <th className="px-5 py-4">Reviewed On</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="transition hover:bg-[#f8faff]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#f8faff]">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-bold text-[#142d4e]">
                          {product.name}
                        </p>

                        {product.is_featured && (
                          <span className="text-[10px] font-bold text-[#1769e0]">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-500">
                    {product.sku || "—"}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {product.category || "Uncategorised"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-bold text-[#142d4e]">
                    {formatPrice(Number(product.price))}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-bold text-[#142d4e]">
                      {product.stock_quantity}
                    </p>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        product.stock_quantity === 0
                          ? "text-red-600"
                          : product.stock_quantity <= 5
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {product.stock_quantity === 0
                        ? "Out of stock"
                        : product.stock_quantity <= 5
                          ? "Low stock"
                          : "In stock"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={isPending && updatingId === product.id}
                      onClick={() => toggleReviewed(product)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                        product.reviewed_at
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {product.reviewed_at ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}

                      {updatingId === product.id
                        ? "Saving..."
                        : product.reviewed_at
                          ? "Reviewed"
                          : "Mark reviewed"}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                    {product.reviewed_at
                      ? new Date(product.reviewed_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        product.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-[#1769e0] transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <Pencil size={14} />
                        Edit
                        <ArrowUpRight size={13} />
                      </a>

                      <DeleteProductButton
                        productId={String(product.id)}
                        productName={product.name}
                        isActive={product.is_active}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}