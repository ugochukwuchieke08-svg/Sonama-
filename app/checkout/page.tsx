"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
ArrowLeft,
ArrowRight,
CheckCircle2,
ShieldCheck,
ShoppingBag,
Truck,
Package,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
getCart,
getCartItemKey,
subscribeToCart,
updateCartQuantity,
removeFromCart,
clearCart,
type CartItem,
} from "@/lib/cart";

type PaymentMethod = "online"; 

type Product = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  installation_available: boolean;
  installation_price: number;
  kit_available: boolean;
  kit_price: number;
  insurance_available: boolean;
};

const formatPrice = (price: number) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

export default function CheckoutPage() {
const router = useRouter();
const supabase = useMemo(() => createClient(), []);

const [cart, setCart] = useState<CartItem[]>([]);
const [products, setProducts] = useState<Product[]>([]);
const [cartLoaded, setCartLoaded] = useState(false);
const [productsLoading, setProductsLoading] = useState(true);

const [paymentMethod] =
useState<PaymentMethod>("online");

const [isSubmitting, setIsSubmitting] = useState(false);
const [orderNumber, setOrderNumber] = useState("");
const [orderTotal, setOrderTotal] = useState(0);
const [orderPaymentMethod, setOrderPaymentMethod] = useState<"cod" | "online">("cod");
const [error, setError] = useState("");

const [form, setForm] = useState({
fullName: "",
email: "",
phone: "",
address: "",
city: "",
state: "",
notes: "",
});

// Load the shared cart and listen for cart updates.
useEffect(() => {
setCart(getCart());
setCartLoaded(true);

const unsubscribe = subscribeToCart(() => {
  setCart(getCart());
});

return unsubscribe;

}, []);

// Fetch the actual products from Supabase.
useEffect(() => {
if (!cartLoaded) return;

let cancelled = false;

async function fetchProducts() {
  setProductsLoading(true);

  if (cart.length === 0) {
    setProducts([]);
    setProductsLoading(false);
    return;
  }

  const productIds = cart.map((item) => item.id);

  const { data, error: fetchError } = await supabase
    .from("products")
    .select(
      "id, name, category, price, stock_quantity, image_url, is_active, installation_available, installation_price, kit_available, kit_price, insurance_available"
    )
    .in("id", productIds)
    .eq("is_active", true);

  if (cancelled) return;

  if (fetchError) {
    console.error("Checkout product fetch error:", fetchError);
    setProducts([]);
  } else {
    setProducts((data || []) as Product[]);
  }

  setProductsLoading(false);
}

fetchProducts();

return () => {
  cancelled = true;
};

}, [cart, cartLoaded, supabase]);

const cartItems = useMemo(() => {
  return cart
    .map((cartItem) => {
      const product = products.find(
        (item) => item.id === cartItem.id
      );

      if (!product) return null;

      const installationCost =
        cartItem.installationSelected && product.installation_available
          ? Number(product.installation_price)
          : 0;

      const kitCost =
        cartItem.kitSelected && product.kit_available
          ? Number(product.kit_price)
          : 0;

      const insuranceCost =
        cartItem.insuranceSelected && product.insurance_available
          ? Number(product.price) * 0.05
          : 0;

      const unitTotal =
        Number(product.price) +
        installationCost +
        kitCost +
        insuranceCost;

      return {
        ...product,
        ...cartItem,
        itemKey: getCartItemKey(cartItem),
        installationCost,
        kitCost,
        insuranceCost,
        unitTotal,
        lineTotal: unitTotal * cartItem.quantity,
      };
    })
    .filter((item) => item !== null);
}, [cart, products]);

const subtotal = cartItems.reduce(
  (total, product) => total + product.lineTotal,
  0
);

// Handle the customer returning from Flutterwave.
useEffect(() => {
  if (!cartLoaded || productsLoading) return;

  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");
  const returnedOrderNumber = params.get("orderNumber");

  if (payment === "success" && returnedOrderNumber) {
    setOrderNumber(returnedOrderNumber);
    setOrderTotal(subtotal);
    setOrderPaymentMethod("online");

    // Payment has been verified by the server.
    clearCart();

    window.history.replaceState({}, "", "/checkout");
  }

  if (payment === "failed") {
    setError(
      "Your payment could not be confirmed. Your cart is still available. You can try again or select Cash on Delivery."
    );

    window.history.replaceState({}, "", "/checkout");
  }
}, [cartLoaded, productsLoading]);

const unavailableItems = cart.filter(
  (cartItem) =>
    !products.some((product) => product.id === cartItem.id)
);

const unavailableExtrasItems = cartItems.filter(
  (item) =>
    (item.installationSelected && !item.installation_available) ||
    (item.kitSelected && !item.kit_available) ||
    (item.insuranceSelected && !item.insurance_available)
);

const totalQuantityByProduct = new Map<string, number>();

cart.forEach((item) => {
  totalQuantityByProduct.set(
    item.id,
    (totalQuantityByProduct.get(item.id) || 0) + item.quantity
  );
});

const outOfStockItems = cartItems.filter(
  (product) =>
    (totalQuantityByProduct.get(product.id) || 0) >
    product.stock_quantity
);

const updateField = (
field: keyof typeof form,
value: string
) => {
setForm((previous) => ({
...previous,
[field]: value,
}));
};

const changeQuantity = (
  itemKey: string,
  quantity: number,
  stockQuantity: number
) => {
  updateCartQuantity(itemKey, quantity, stockQuantity);
  setError("");
};

const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError("");

  if (cartItems.length === 0) {
    setError("Your cart is empty. Please add products before checking out.");
    return;
  }

  if (unavailableItems.length > 0) {
    setError("Some products are no longer available. Please remove them.");
    return;
  }

  if (outOfStockItems.length > 0) {
    setError("One or more products have insufficient stock.");
    return;
  }

  if (!/^[0-9+\s()-]{7,20}$/.test(form.phone.trim())) {
    setError("Please enter a valid phone number.");
    return;
  }

  if (unavailableExtrasItems.length > 0) {
  setError(
    "Some selected services are no longer available. Please return to your cart and update your selections."
  );
  return;
}

  setIsSubmitting(true);

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: form,
        items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        installationSelected: item.installationSelected,
        kitSelected: item.kitSelected,
        insuranceSelected: item.insuranceSelected,
      })),
        paymentMethod,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to place your order.");
    }

    // Redirect customers to Flutterwave.
if (result.paymentMethod !== "flutterwave") {
  throw new Error(
    "Unable to initialize online payment. Please try again."
  );
}

if (!result.checkoutUrl) {
  throw new Error(
    "Unable to generate payment link. Please try again."
  );
}

window.location.assign(result.checkoutUrl);
return;



  } catch (error) {
    console.error("Checkout error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

if (!cartLoaded || productsLoading) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#fafafa]">
<p className="text-sm font-semibold text-gray-500">
Loading your checkout...
</p>
</main>
);
}

if (orderNumber) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5 py-12">
<section className="w-full max-w-lg rounded-[28px] border border-gray-100 bg-white p-7 text-center shadow-xl shadow-gray-200/50 sm:p-10">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
<CheckCircle2 size={42} />
</div>

      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-green-600">
        Order successful
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-[#142d4e]">
        Thank you for your order!
      </h1>

      <p className="mt-4 text-sm leading-7 text-gray-500">
          {orderPaymentMethod === "online"
            ? "Your online payment has been verified successfully. Your order is now awaiting processing by our team."
            : "Your order has been successfully saved. Our team will contact you to confirm your order and delivery details."}
        </p>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-left">
        <p className="text-xs font-semibold text-gray-500">
          ORDER NUMBER
        </p>

        <p className="mt-2 text-xl font-black text-[#1769e0]">
          {orderNumber}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-sm text-gray-500">
            Order total
          </span>

          <span className="font-black text-[#142d4e]">
            {formatPrice(orderTotal)}
          </span>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Payment method: {orderPaymentMethod === "online" ? "Flutterwave (Paid)" : "Cash on Delivery"}
        </p>
      </div>

      <button
        onClick={() => router.push("/track-order")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e87928] px-6 py-4 font-bold text-white transition hover:bg-[#cf641b]"
      >
        Track My Order
      </button>

      <button
        onClick={() => router.push("/")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1769e0] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Continue Shopping <ArrowRight size={18} />
      </button>
    </section>
  </main>
);

}

return (
<main className="min-h-screen bg-[#f5f7fb] text-[#171923]">
<header className="border-b border-gray-100 bg-white">
<div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
<button
onClick={() => router.push("/")}
className="flex items-center gap-2 text-xl font-black tracking-tight"
>
SONAMA<span className="text-[#1769e0]">WILLS</span>
</button>

      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <ShieldCheck size={17} className="text-green-600" />
        Secured checkout
      </div>
    </div>
  </header>

  <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
    <button
      onClick={() => router.push("/")}
      className="mb-7 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#1769e0]"
    >
      <ArrowLeft size={17} /> Continue shopping
    </button>

    <div className="mb-9">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
        Almost yours
      </p>

      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#142d4e] sm:text-4xl">
        Checkout
      </h1>

      <p className="mt-3 text-sm text-gray-500">
        Enter your details to complete your  order.
      </p>
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1769e0]">
            <Package size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#142d4e]">
              Track your orders with ease!
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Create a free SONAMA WILLS account to track your
              orders, monitor delivery progress, check payment
              status and access your purchase history anytime.
            </p>

            <p className="mt-2 text-xs font-medium text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login?redirect=/checkout"
                className="font-bold text-[#1769e0] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
  </div>

  <Link
    href="/register?redirect=/checkout"
    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1769e0] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
  >
    Create Free Account
    <ArrowRight size={16} className="ml-2" />
  </Link>
</div>
      
    </div>

    {cart.length === 0 ? (
      <section className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
        <ShoppingBag
          size={42}
          className="mx-auto text-[#1769e0]"
        />

        <h2 className="mt-5 text-xl font-black">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Add a product to your cart before checking out.
        </p>

        <button
          onClick={() => router.push("/products")}
          className="mt-6 rounded-full bg-[#1769e0] px-6 py-3 text-sm font-bold text-white"
        >
          Browse Products
        </button>
      </section>
    ) : (
      <form
        onSubmit={placeOrder}
        className="grid items-start gap-8 lg:grid-cols-[1fr_390px]"
      >
        <div className="space-y-7">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-black text-[#1769e0]">
                01
              </span>

              <div>
                <h2 className="text-lg font-black">
                  Customer information
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  How can we reach you?
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                Full name *
                <input
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) =>
                    updateField("fullName", e.target.value)
                  }
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="text-sm font-semibold text-gray-700">
                Email address *
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="text-sm font-semibold text-gray-700">
                Phone number *
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="+234 800 000 0000"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-black text-[#1769e0]">
                02
              </span>

              <div>
                <h2 className="text-lg font-black">
                  Delivery address
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Where should the order be delivered?
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                Street address *
                <input
                  required
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="House number, street name, area"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="text-sm font-semibold text-gray-700">
                City *
                <input
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="Enter city"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="text-sm font-semibold text-gray-700">
                State *
                <input
                  required
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(e) =>
                    updateField("state", e.target.value)
                  }
                  placeholder="Enter state"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                Delivery notes{" "}
                <span className="font-normal text-gray-400">
                  (optional)
                </span>

                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
                  }
                  placeholder="Landmarks or special delivery instructions"
                  className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3.5 font-normal outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-blue-50"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-black text-[#1769e0]">
                03
              </span>

              <div>
                <h2 className="text-lg font-black">
                  Payment method
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Choose how you would like to pay.
                </p>
              </div>
            </div>

            <div className="space-y-3">
             

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  paymentMethod === "online"
                    ? "border-[#1769e0] bg-blue-50/60"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                

                <div>
                  <p className="font-bold">Online Payment</p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Pay securely online using Flutterwave.
                    </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
          <h2 className="text-lg font-black">Your order</h2>

          <p className="mt-1 text-xs text-gray-500">
            {cart.reduce(
              (total, item) => total + item.quantity,
              0
            )}{" "}
            items in your cart
          </p>

          <div className="mt-6 space-y-5">
            {cartItems.map((product) => (
              <div key={product.itemKey} className="flex gap-3">
                <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2">
                  <img
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />

                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#142d4e] px-1 text-xs font-bold text-white">
                    {product.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {product.category || "Electronics"}
                  </p>

                  <h3 className="mt-1 text-sm font-bold leading-5">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-sm font-black text-[#142d4e]">
                  {formatPrice(product.lineTotal)}
                </p>

                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>Product: {formatPrice(product.price)} each</p>

                  {product.installationSelected && (
                    <p>
                      Installation: {formatPrice(product.installationCost)} each
                    </p>
                  )}

                  {product.kitSelected && (
                    <p>
                      Kit/accessories: {formatPrice(product.kitCost)} each
                    </p>
                  )}

                  {product.insuranceSelected && (
                    <p>
                      Insurance: {formatPrice(product.insuranceCost)} each
                    </p>
                  )}
                </div>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(
                        product.itemKey,
                        product.quantity - 1,
                        product.stock_quantity
                      )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50"
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      −
                    </button>

                    <span className="text-xs font-semibold">
                      {product.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(
                        product.itemKey,
                        product.quantity + 1,
                        product.stock_quantity
                      )
                      }
                      disabled={
                        (totalQuantityByProduct.get(product.id) || 0) >=
                        product.stock_quantity
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(product.itemKey)}
                      className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  {product.stock_quantity < product.quantity && (
                    <p className="mt-2 text-xs text-red-500">
                      Only {product.stock_quantity} available.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {unavailableItems.length > 0 && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-600">
              Some products in your cart are no longer available.
              Please remove them and continue.
            </div>
          )}

          {unavailableExtrasItems.length > 0 && (
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-600">
            Some selected services are no longer available. Please
            return to your cart and update your selections.
          </div>
        )}

          <div className="mt-7 space-y-3 border-t border-gray-100 pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>

              <span className="font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>

              <span className="font-semibold">
                To be confirmed
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="font-bold">Total</span>

              <span className="text-xl font-black text-[#142d4e]">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
            isSubmitting ||
            productsLoading ||
            unavailableItems.length > 0 ||
            unavailableExtrasItems.length > 0 ||
            outOfStockItems.length > 0 ||
            cartItems.length === 0
          }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1769e0] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? paymentMethod === "online"
                ? "Redirecting to payment..."
                : "Placing order..."
              : paymentMethod === "online"
                ? "Proceed to Payment"
                : "Place Order"}

            {!isSubmitting && <ArrowRight size={18} />}
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-gray-400">
            <Truck size={15} />
            Your order will be confirmed by our team.
          </p>
        </aside>
      </form>
    )}
  </div>
</main>

);
}