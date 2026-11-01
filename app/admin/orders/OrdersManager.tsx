"use client";

import { useMemo, useState } from "react";
import {
Search,
Eye,
X,
Package,
Loader2,
RefreshCw,
AlertCircle,
} from "lucide-react";

type Order = {
id: string;
orderNumber: string;
customerName: string;
email: string | null;
phone: string;
address: string;
city: string | null;
state: string | null;
subtotal: number;
deliveryFee: number;
total: number;
paymentMethod: string;
paymentStatus: string;
status: string;
createdAt: string;
};

type OrderItem = {
id: string;
name: string;
image: string | null;
quantity: number;
price: number;
lineTotal: number;
};

type Props = {
initialOrders: Order[];
};

const statusOptions = [
"pending",
"confirmed",
"processing",
"shipped",
"delivered",
"cancelled",
];

function formatPrice(amount: number) {
return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(date: string) {
return new Date(date).toLocaleString("en-NG", {
day: "numeric",
month: "short",
year: "numeric",
hour: "numeric",
minute: "2-digit",
});
}

function getStatusStyle(status: string) {
switch (status) {
case "pending":
return "bg-amber-50 text-amber-700";

case "confirmed":
case "processing":
  return "bg-blue-50 text-blue-700";

case "shipped":
  return "bg-purple-50 text-purple-700";

case "delivered":
  return "bg-green-50 text-green-700";

case "cancelled":
  return "bg-red-50 text-red-700";

default:
  return "bg-gray-100 text-gray-600";

}
}

export default function OrdersManager({ initialOrders }: Props) {
const [orders, setOrders] = useState(initialOrders);
const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
const [detailsLoading, setDetailsLoading] = useState(false);
const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
const [error, setError] = useState("");

const filteredOrders = useMemo(() => {
const query = search.trim().toLowerCase();

return orders.filter((order) => {
  const matchesSearch =
    !query ||
    order.orderNumber.toLowerCase().includes(query) ||
    order.customerName.toLowerCase().includes(query) ||
    (order.email || "").toLowerCase().includes(query) ||
    order.phone.toLowerCase().includes(query);

  const matchesFilter =
    filter === "all" || order.status === filter;

  return matchesSearch && matchesFilter;
});

}, [orders, search, filter]);

async function openOrder(order: Order) {
setSelectedOrder(order);
setOrderItems([]);
setDetailsLoading(true);
setError("");

try {
  const response = await fetch("/api/admin/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "details",
      orderId: order.id,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to load order details.");
  }

  setOrderItems(result.items || []);
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Unable to load order details."
  );
} finally {
  setDetailsLoading(false);
}

}

async function updateOrderStatus(
orderId: string,
newStatus: string
) {
setUpdatingOrder(orderId);
setError("");

try {
  const response = await fetch("/api/admin/orders", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      status: newStatus,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to update order.");
  }

  setOrders((currentOrders) =>
    currentOrders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    )
  );

  setSelectedOrder((currentOrder) =>
    currentOrder?.id === orderId
      ? { ...currentOrder, status: newStatus }
      : currentOrder
  );
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Something went wrong while updating the order."
  );
} finally {
  setUpdatingOrder(null);
}

}

return (
<div>
{/* Search and filters */}
<div className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
<div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-gray-200 px-4 focus-within:border-[#1769e0]">
<Search size={19} className="shrink-0 text-gray-400" />

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search order, customer, email or phone..."
        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>

    <select
      value={filter}
      onChange={(event) => setFilter(event.target.value)}
      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#1769e0]"
    >
      <option value="all">All orders</option>
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  </div>

  {/* Error message */}
  {error && (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      <AlertCircle size={19} className="shrink-0" />
      <p>{error}</p>

      <button
        type="button"
        onClick={() => setError("")}
        className="ml-auto font-bold"
        aria-label="Dismiss error"
      >
        <X size={17} />
      </button>
    </div>
  )}

  {/* Orders table */}
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
      <div>
        <h2 className="font-extrabold">All orders</h2>
        <p className="mt-1 text-xs text-gray-400">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
      >
        <RefreshCw size={15} />
        Refresh
      </button>
    </div>

    {filteredOrders.length === 0 ? (
      <div className="px-5 py-16 text-center">
        <Package
          size={35}
          className="mx-auto mb-3 text-gray-300"
        />

        <h3 className="font-bold text-gray-700">
          No orders found
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          Try changing your search or status filter.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="transition hover:bg-gray-50/70"
              >
                <td className="px-5 py-5">
                  <p className="text-sm font-extrabold">
                    {order.orderNumber}
                  </p>
                </td>

                <td className="px-5 py-5">
                  <p className="text-sm font-bold">
                    {order.customerName}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {order.email || order.phone}
                  </p>
                </td>

                <td className="px-5 py-5 text-xs text-gray-500">
                  {formatDate(order.createdAt)}
                </td>

                <td className="px-5 py-5 text-sm font-extrabold">
                  {formatPrice(order.total)}
                </td>

                <td className="px-5 py-5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold capitalize">
                      {order.paymentMethod.replace(/[_-]/g, " ")}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        order.paymentStatus === "paid"
                          ? "text-green-600"
                          : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-5">
                  <select
                    value={order.status}
                    disabled={updatingOrder === order.id}
                    onChange={(event) =>
                      updateOrderStatus(order.id, event.target.value)
                    }
                    className={`rounded-full px-3 py-2 text-xs font-bold capitalize outline-none disabled:opacity-50 ${getStatusStyle(order.status)}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingOrder === order.id && (
                    <Loader2
                      size={14}
                      className="ml-2 inline animate-spin text-gray-400"
                    />
                  )}
                </td>

                <td className="px-5 py-5">
                  <button
                    type="button"
                    onClick={() => openOrder(order)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1769e0]"
                  >
                    <Eye size={15} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>

  {/* Order details modal */}
  {selectedOrder && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1d32]/60 p-4 backdrop-blur-sm"
      onClick={() => setSelectedOrder(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Order details
            </p>
            <h2
              id="order-details-title"
              className="mt-1 text-xl font-extrabold"
            >
              {selectedOrder.orderNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            aria-label="Close order details"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Customer */}
          <section>
            <h3 className="mb-3 text-sm font-extrabold">
              Customer information
            </h3>

            <div className="grid gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.customerName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.phone}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">Email</p>
                <p className="mt-1 font-bold">
                  {selectedOrder.email || "Not provided"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">
                  Delivery address
                </p>
                <p className="mt-1 font-bold leading-6">
                  {[
                    selectedOrder.address,
                    selectedOrder.city,
                    selectedOrder.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="mb-3 text-sm font-extrabold">
              Purchased products
            </h3>

            {detailsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 size={19} className="animate-spin" />
                Loading products...
              </div>
            ) : orderItems.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400">
                No product details found.
              </p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1769e0]">
                          <Package size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-extrabold">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Payment summary */}
          <section className="rounded-xl bg-[#f0f6ff] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">
                {formatPrice(selectedOrder.subtotal)}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-500">Delivery fee</span>
              <span className="font-semibold">
                {formatPrice(selectedOrder.deliveryFee)}
              </span>
            </div>

            <div className="mt-4 flex justify-between border-t border-blue-100 pt-4">
              <span className="font-extrabold">Total</span>
              <span className="text-lg font-black text-[#1769e0]">
                {formatPrice(selectedOrder.total)}
              </span>
            </div>
          </section>

          <p className="text-xs text-gray-400">
            Placed on {formatDate(selectedOrder.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )}
</div>

);
}