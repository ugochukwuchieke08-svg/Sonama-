import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const formatPrice = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export default async function AccountPage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const customerName =
    user.user_metadata?.full_name || "Customer";

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, order_number, total_amount, status, payment_status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-indigo-100 text-indigo-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-gray-500 hover:text-black"
            >
              ← Back to store
            </Link>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              My Account
            </h1>

            <p className="mt-2 text-gray-500">
              Welcome back, {customerName}.
            </p>
          </div>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={17} />
              Log out
            </button>
          </form>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
              <ShoppingBag size={21} className="text-black" />
            </div>

            <p className="text-sm text-gray-500">Account name</p>
            <p className="mt-1 font-semibold text-gray-900">
              {customerName}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {user.email}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
              <Package size={21} className="text-black" />
            </div>

            <p className="text-sm text-gray-500">Total orders</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {orders?.length ?? 0}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              My Orders
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View your purchases and track their progress.
            </p>
          </div>

          {ordersError ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Unable to load your orders. Please try again later.
            </p>
          ) : !orders || orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package
                size={40}
                className="mx-auto mb-4 text-gray-300"
              />

              <h3 className="font-semibold text-gray-900">
                No orders yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Your purchases will appear here.
              </p>

              <Link
                href="/"
                className="mt-5 inline-block rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {order.order_number}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                      {formatPrice(Number(order.total_amount ?? 0))}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                        statusColors[order.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>

                    <Link
                      href={`/track-order?order=${encodeURIComponent(
                        order.order_number
                      )}`}
                      className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Track order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}