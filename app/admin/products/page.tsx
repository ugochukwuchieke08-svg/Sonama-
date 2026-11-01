
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteProductButton from "./DeleteProductButton";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  ArrowUpRight,
  Boxes,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Verify the logged-in user.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // Verify that the user is an authorized administrator.
  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/admin/login");
  }

  // Fetch products from Supabase.
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, category, sku, price, stock_quantity, image_url, is_active, is_featured, created_at"
    )
    .order("created_at", { ascending: false });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(price);

  const productList = products ?? [];

  const totalProducts = productList.length;

  const activeProducts = productList.filter(
    (product) => product.is_active
  ).length;

  const outOfStock = productList.filter(
    (product) => product.stock_quantity === 0
  ).length;

  const lowStock = productList.filter(
    (product) =>
      product.stock_quantity > 0 && product.stock_quantity <= 5
  ).length;

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      iconStyle: "bg-blue-50 text-[#1769e0]",
    },
    {
      label: "Active Products",
      value: activeProducts,
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: AlertTriangle,
      iconStyle: "bg-amber-50 text-amber-600",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: XCircle,
      iconStyle: "bg-red-50 text-red-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#142d4e]">
      {/* Page header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span>SONAMA WILLS</span>
              <span>/</span>
              <span>Inventory</span>
            </div>

            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#142d4e] sm:text-3xl">
              Products
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your catalogue, prices, and available stock.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1255b9] focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(20,45,78,0.025)] transition hover:border-blue-200 hover:shadow-[0_8px_25px_rgba(20,45,78,0.05)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-500">
                    {stat.label}
                  </p>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-5 text-2xl font-extrabold tracking-tight text-[#142d4e]">
                  {stat.value.toLocaleString()}
                </p>
              </article>
            );
          })}
        </div>

        {/* Inventory table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_10px_rgba(20,45,78,0.025)]">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#142d4e]">
                Product Inventory
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {totalProducts} product
                {totalProducts === 1 ? "" : "s"} in your database
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-[#fafafa] px-3.5 py-2.5 text-sm text-gray-500">
              <Search size={16} />
              <span>Inventory overview</span>
            </div>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <AlertTriangle
                size={30}
                className="mx-auto mb-3 text-red-500"
              />

              <h3 className="font-bold text-red-600">
                Unable to load products
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {error.message}
              </p>
            </div>
          ) : productList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1769e0]">
                <Package size={30} />
              </div>

              <h3 className="text-lg font-extrabold text-[#142d4e]">
                No products added yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Your inventory is empty. Add your first product to start
                managing the SONAMA WILLS store.
              </p>

              <Link
                href="/admin/products/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1255b9]"
              >
                <Plus size={18} />
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-[#f8faff] text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">Product</th>
                    <th className="px-5 py-4 font-bold">SKU</th>
                    <th className="px-5 py-4 font-bold">Category</th>
                    <th className="px-5 py-4 font-bold">Price</th>
                    <th className="px-5 py-4 font-bold">Stock</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 text-right font-bold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {productList.map((product) => {
                    const stockStatus =
                      product.stock_quantity === 0
                        ? "Out of stock"
                        : product.stock_quantity <= 5
                          ? "Low stock"
                          : "In stock";

                    const stockStyle =
                      product.stock_quantity === 0
                        ? "text-red-600"
                        : product.stock_quantity <= 5
                          ? "text-amber-600"
                          : "text-emerald-600";

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#f8faff]"
                      >
                        {/* Product */}
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
                                <Package
                                  size={20}
                                  className="text-gray-400"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-bold text-[#142d4e]">
                                {product.name}
                              </p>

                              {product.is_featured && (
                                <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1769e0]">
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

                          <p className={`mt-1 text-xs font-semibold ${stockStyle}`}>
                            {stockStatus}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                              product.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                product.is_active
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-[#1769e0] transition hover:border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil size={14} />
                            Edit
                            <ArrowUpRight size={13} />
                          </Link>
                          <DeleteProductButton
                              productId={String(product.id)}
                              productName={product.name}
                              isActive={product.is_active}
                            />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Inventory note */}
        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-400">
          <Boxes size={15} className="mt-0.5 shrink-0" />
          <p>
            Inventory data is loaded directly from your Supabase database.
            Stock indicators flag products with five or fewer units remaining.
          </p>
        </div>

        <footer className="mt-8 border-t border-gray-200 pt-5">
          <p className="text-xs font-medium text-gray-400">
            SONAMA WILLS · Product management
          </p>
        </footer>
      </div>
    </main>
  );
}

