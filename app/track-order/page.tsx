"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Search,
  CheckCircle2,
  Truck,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Headphones,
} from "lucide-react";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  lineTotal?: number;
};

type Order = {
  orderNumber: string;
  customerName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  items: OrderItem[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
};

const formatPrice = (price: number) =>
  `₦${price.toLocaleString("en-NG")}`;

const trackingStages = [
  {
    title: "Order Placed",
    description: "Your order has been received.",
    icon: ShoppingBag,
  },
  {
    title: "Processing",
    description: "Your items are being prepared.",
    icon: Package,
  },
  {
    title: "Shipped",
    description: "Your order is on its way.",
    icon: Truck,
  },
  {
    title: "Delivered",
    description: "Your order has arrived.",
    icon: CheckCircle2,
  },
];

function getOrderStatus(order: Order) {
  const status = (order.status || "pending")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (status.includes("cancel")) return "cancelled";
  if (status.includes("deliver")) return "delivered";

  if (
    status.includes("ship") ||
    status.includes("out for delivery")
  ) {
    return "shipped";
  }

  if (
    status.includes("process") ||
    status.includes("confirm") ||
    status.includes("ready")
  ) {
    return "processing";
  }

  return "placed";
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const handleTrackOrder = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!orderNumber.trim() || !email.trim()) return;

    setLoading(true);
    setSearched(false);
    setFoundOrder(null);
    setTrackingError("");

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to find your order."
        );
      }

      if (!result.order) {
        throw new Error("No order information was returned.");
      }

      setFoundOrder(result.order as Order);
    } catch (error) {
      console.error("Order tracking failed:", error);

      setTrackingError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const orderStatus = foundOrder
    ? getOrderStatus(foundOrder)
    : "placed";

  const currentStage =
    orderStatus === "placed"
      ? 0
      : orderStatus === "processing"
        ? 1
        : orderStatus === "shipped"
          ? 2
          : orderStatus === "delivered"
            ? 3
            : -1;

  const items = foundOrder?.items || [];

  const calculatedTotal = items.reduce(
    (sum, item) =>
      sum + item.price * (item.quantity || 1),
    0
  );

  const orderTotal = foundOrder
  ? foundOrder.total ??
    (foundOrder.subtotal + foundOrder.deliveryFee)
  : calculatedTotal;

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171923]">
      {/* Announcement bar */}
      <div className="bg-[#142d4e] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Quality home appliances. Shopping made simple.
        <span className="ml-2 hidden text-blue-200 sm:inline">
          Discover your next upgrade →
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769e0] text-white shadow-lg shadow-blue-100">
              <Zap size={23} fill="white" />
            </span>

            <span className="text-xl font-black tracking-tight sm:text-2xl">
              SONAMA <span className="text-[#1769e0]"> WILLS</span>
              <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.24em] text-gray-400">
                ELECTRONICS & HOME
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#1769e0]"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Continue shopping</span>
            <span className="sm:hidden">Shop</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 md:py-16 lg:px-12">
        {/* Page introduction */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1769e0]">
            <Truck size={31} />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
            Order Updates
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Track your order.
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-500 sm:text-base">
            Enter your order number and email address to view your
            order details and follow its delivery progress.
          </p>
        </div>

        {/* Order search card */}
        <div className="mx-auto mt-10 max-w-2xl rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleTrackOrder}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="orderNumber"
                  className="mb-3 block text-sm font-bold"
                >
                  Order number
                </label>

                <div className="flex h-14 items-center gap-3 rounded-xl border border-gray-200 px-4 transition focus-within:border-[#1769e0] focus-within:ring-4 focus-within:ring-blue-50">
                  <Search
                    size={20}
                    className="shrink-0 text-gray-400"
                  />

                  <input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={(event) =>
                      setOrderNumber(event.target.value)
                    }
                    placeholder="e.g. SW-12345678"
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="trackingEmail"
                  className="mb-3 block text-sm font-bold"
                >
                  Email address used for the order
                </label>

                <input
                  id="trackingEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  className="h-14 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium outline-none transition placeholder:text-gray-400 focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-7 text-sm font-bold text-white transition hover:bg-[#1255b9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Finding your order..." : "Track order"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-400">
              Use the order reference and email address you provided
              during checkout.
            </p>
          </form>
        </div>

        {/* Order not found / tracking error */}
        {searched && !foundOrder && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <Package
              size={30}
              className="mx-auto mb-3 text-red-500"
            />

            <h2 className="font-bold text-red-800">
              Unable to find your order
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {trackingError ||
                "We couldn't find an order matching those details. Please check and try again."}
            </p>
          </div>
        )}

        {/* Found order */}
        {foundOrder && (
          <div className="mt-8 space-y-6">
            {/* Order reference and delivery progress */}
            <div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Order reference
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {foundOrder.orderNumber}
                  </h2>

                  {foundOrder.createdAt && (
                    <p className="mt-2 text-sm text-gray-500">
                      Ordered on{" "}
                      {new Date(
                        foundOrder.createdAt
                      ).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold capitalize ${
                    orderStatus === "cancelled"
                      ? "bg-red-50 text-red-600"
                      : orderStatus === "delivered"
                        ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-[#1769e0]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {orderStatus}
                </span>
              </div>

              {/* Delivery progress */}
              {orderStatus !== "cancelled" ? (
                <div className="py-8">
                  <h3 className="mb-8 text-lg font-bold">
                    Delivery progress
                  </h3>

                  <div className="relative">
                    <div className="absolute left-[8%] right-[8%] top-5 h-1 rounded-full bg-gray-100" />

                    <div
                      className="absolute left-[8%] top-5 h-1 rounded-full bg-[#1769e0] transition-all duration-500"
                      style={{
                        width: `${Math.max(0, currentStage) * 28}%`,
                      }}
                    />

                    <div className="relative grid grid-cols-4 gap-1">
                      {trackingStages.map((stage, index) => {
                        const Icon = stage.icon;
                        const completed = index <= currentStage;

                        return (
                          <div
                            key={stage.title}
                            className="flex flex-col items-center text-center"
                          >
                            <div
                              className={`z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white ${
                                completed
                                  ? "bg-[#1769e0] text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 size={19} />
                              ) : (
                                <Icon size={18} />
                              )}
                            </div>

                            <p
                              className={`mt-3 text-[10px] font-bold sm:text-sm ${
                                completed
                                  ? "text-[#142d4e]"
                                  : "text-gray-400"
                              }`}
                            >
                              {stage.title}
                            </p>

                            <p className="mt-1 hidden max-w-[120px] text-xs leading-5 text-gray-400 sm:block">
                              {stage.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  This order has been cancelled.
                </div>
              )}
            </div>

            {/* Customer and order information */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Delivery information */}
              <div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                    <MapPin size={20} />
                  </div>

                  <h3 className="font-bold">
                    Delivery information
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="mt-1 font-semibold">
                      {foundOrder.customerName || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Phone number
                    </p>
                    <p className="mt-1 font-semibold">
                      {foundOrder.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Delivery address
                    </p>
                    <p className="mt-1 font-semibold leading-6">
                      {[
                        foundOrder.address,
                        foundOrder.city,
                        foundOrder.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
                    <ShieldCheck size={20} />
                  </div>

                  <h3 className="font-bold">Order summary</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Items</span>
                    <span className="font-semibold">
                      {items.length}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Payment method
                    </span>
                    <span className="font-semibold capitalize">
                      {(foundOrder.paymentMethod || "Not specified").replace(
                        /[_-]/g,
                        " "
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Payment status
                    </span>
                    <span className="font-semibold capitalize">
                      {foundOrder.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 border-t border-gray-100 pt-4">
                    <span className="font-bold">Order total</span>
                    <span className="text-lg font-black text-[#142d4e]">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered products */}
            {items.length > 0 && (
              <div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="mb-6 text-lg font-bold">
                  Items in your order
                </h3>

                <div className="space-y-5">
                  {items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f3f5f8] text-[#1769e0]">
                          <Package size={23} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-[#142d4e]">
                        {formatPrice(
                          item.price * (item.quantity || 1)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer support banner */}
        <div className="mt-10 overflow-hidden rounded-[26px] bg-[#102746] p-7 text-white sm:p-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[#70b2ff]">
                <Headphones size={19} />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Need assistance?
                </span>
              </div>

              <h3 className="text-xl font-black sm:text-2xl">
                We&apos;re here to help.
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-300">
                Contact our team if you need help with an order,
                product availability, or delivery.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[#1769e0] px-6 text-sm font-bold text-white transition hover:bg-[#1255b9] sm:self-auto"
            >
              Contact us
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {/* Back to store */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-[#1769e0]"
          >
            <ArrowLeft size={16} />
            Back to SONAMA WILLS
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1d32] px-5 py-7 text-center text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-2 sm:flex-row">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1769e0]">
            <Zap size={17} fill="white" />
          </span>

          <p className="text-xs text-gray-400">
            © 2026 SONAMA WILLS. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}