
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  ShoppingBag,
  Wallet,
  Clock3,
  ArrowUpRight,
  Plus,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Verify the authenticated user's identity.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // Confirm that this user is an authorized administrator.
  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/admin/login");
  }

  // Fetch actual store statistics.
  const [
    productsResult,
    ordersResult,
    pendingResult,
    paidOrdersResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("orders")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "processing"]),

    supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "paid"),
  ]);

  const dataError =
    productsResult.error ||
    ordersResult.error ||
    pendingResult.error ||
    paidOrdersResult.error;

  const productCount = productsResult.count ?? 0;
  const orderCount = ordersResult.count ?? 0;
  const pendingCount = pendingResult.count ?? 0;

  const totalSales = (paidOrdersResult.data ?? []).reduce(
    (total, order) => total + Number(order.total_amount),
    0
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount);

  const stats = [
    {
      label: "Total Products",
      value: productCount.toLocaleString(),
      description: "Products in your catalogue",
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-[#1769e0]",
    },
    {
      label: "Total Orders",
      value: orderCount.toLocaleString(),
      description: "All recorded orders",
      icon: ShoppingBag,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Pending Orders",
      value: pendingCount.toLocaleString(),
      description: "Orders needing attention",
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Paid Order Value",
      value: formatCurrency(totalSales),
      description: "Value of recorded paid orders",
      icon: Wallet,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
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
              <span>Administration</span>
            </div>

            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#142d4e] sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome back. Here&apos;s what&apos;s happening with your store.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1255b9] focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={18} />
            Add product
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
        {/* Database error */}
        {dataError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">
                Some statistics could not be loaded.
              </p>
              <p className="mt-1 leading-6 text-red-600">
                Check your Supabase connection, database permissions, and
                the relevant tables.
              </p>
            </div>
          </div>
        )}

        {/* Overview heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#142d4e]">
              Store overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              A summary of your current store activity.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            Admin workspace
          </div>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(20,45,78,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_25px_rgba(20,45,78,0.06)] sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-500">
                    {stat.label}
                  </p>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </div>
                </div>

                <p className="mt-5 break-words text-2xl font-extrabold tracking-tight text-[#142d4e] sm:text-[27px]">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  {stat.description}
                </p>
              </article>
            );
          })}
        </div>

        {/* Management shortcuts */}
        <div className="mb-5 mt-9">
          <h2 className="text-lg font-extrabold text-[#142d4e]">
            Manage your store
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quick access to the most important parts of your business.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_10px_rgba(20,45,78,0.025)] transition hover:border-blue-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
              <Package size={23} />
            </div>

            <h3 className="mt-5 text-base font-extrabold text-[#142d4e]">
              Product management
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
              Manage your electronics catalogue, update product prices,
              upload product images, and maintain accurate stock quantities.
            </p>

            <Link
              href="/admin/products"
              className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-[#1769e0] transition hover:text-[#1255b9]"
            >
              Manage products
              <ArrowUpRight size={17} />
            </Link>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_10px_rgba(20,45,78,0.025)] transition hover:border-blue-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={23} />
            </div>

            <h3 className="mt-5 text-base font-extrabold text-[#142d4e]">
              Customer orders
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
              Review customer orders, check payment statuses, and manage
              order processing and delivery.
            </p>

            <Link
              href="/admin/orders"
              className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-[#1769e0] transition hover:text-[#1255b9]"
            >
              Manage orders
              <ArrowUpRight size={17} />
            </Link>
          </article>
        </div>

        {/* Getting started */}
        <section className="mt-6 rounded-2xl border border-blue-100 bg-[#f0f6ff] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1769e0] shadow-sm">
              <ShoppingBag size={20} />
            </div>

            <div>
              <h3 className="font-extrabold text-[#142d4e]">
                Keep your store up to date
              </h3>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-600">
                Add your products, maintain accurate stock levels, and
                regularly review orders. Before accepting real customer
                payments, ensure checkout and payment verification are
                properly configured.
              </p>

              <Link
                href="/admin/products"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1255b9]"
              >
                View products
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-gray-200 pt-5">
          <p className="text-xs font-medium text-gray-400">
            SONAMA WILLS · Store administration
          </p>
        </footer>
      </div>
    </main>
  );
}

