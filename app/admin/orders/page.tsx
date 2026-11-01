import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Clock3,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import OrdersManager from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Verify authenticated user
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/admin/login");
  }

  // Verify administrator access
  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/admin/login");
  }

  // Fetch orders
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      delivery_city,
      delivery_state,
      subtotal,
      delivery_fee,
      total_amount,
      payment_method,
      payment_status,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  const orderList = (orders || []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone,
    address: order.delivery_address,
    city: order.delivery_city,
    state: order.delivery_state,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total_amount),
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: order.status,
    createdAt: order.created_at,
  }));

  const pendingCount = orderList.filter(
    (order) => order.status === "pending"
  ).length;

  const processingCount = orderList.filter(
    (order) =>
      order.status === "confirmed" ||
      order.status === "processing"
  ).length;

  const shippedCount = orderList.filter(
    (order) => order.status === "shipped"
  ).length;

  const deliveredCount = orderList.filter(
    (order) => order.status === "delivered"
  ).length;

  const stats = [
    {
      label: "Total orders",
      value: orderList.length,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock3,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Processing",
      value: processingCount,
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Shipped",
      value: shippedCount,
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Delivered",
      value: deliveredCount,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#142d4e]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-gray-400 transition hover:text-[#1769e0]"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Customer orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review and manage orders placed in your store.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                >
                  <Icon size={20} />
                </div>

                <p className="mt-4 text-2xl font-extrabold">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {stat.label}
                </p>
              </article>
            );
          })}
        </div>

        {/* Orders */}
        <section className="mt-8">
          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <AlertCircle size={20} className="shrink-0" />

              <div>
                <p className="font-bold">
                  Unable to load orders.
                </p>
                <p className="mt-1">
                  {error.message}
                </p>
              </div>
            </div>
          ) : (
            <OrdersManager initialOrders={orderList} />
          )}
        </section>
      </div>
    </main>
  );
}