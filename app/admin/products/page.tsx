
import Link from "next/link";
import { redirect } from "next/navigation";
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
import ProductsTable from "./ProductsTable";
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
      "id, name, category, sku, price, stock_quantity, image_url, is_active, is_featured, created_at, reviewed_at"
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
{error ? (
  <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
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
) : (
  <ProductsTable products={productList} />
)}

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

