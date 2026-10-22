
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";


const products = [
  {
    id: 1,
    name: "55-inch Smart 4K UHD TV",
    brand: "Samsung",
    price: 685000,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    name: "Double Door Refrigerator",
    brand: "Hisense",
    price: 545000,
    image:
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    name: "Front Load Washing Machine",
    brand: "LG",
    price: 420000,
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    name: "Modern Chest Freezer",
    brand: "Haier Thermocool",
    price: 335000,
    image:
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 5,
    name: "Split Air Conditioner",
    brand: "LG",
    price: 490000,
    image:
      "https://images.unsplash.com/photo-1631545806609-8c3c3b0b0c93?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 6,
    name: "Premium Smart Television",
    brand: "Hisense",
    price: 475000,
    image:
      "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 7,
    name: "Compact Microwave Oven",
    brand: "Samsung",
    price: 145000,
    image:
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 8,
    name: "Premium Electric Blender",
    brand: "Binatone",
    price: 48000,
    image:
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 9,
    name: "Automatic Coffee Maker",
    brand: "Philips",
    price: 92000,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 10,
    name: "Cordless Vacuum Cleaner",
    brand: "Samsung",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 11,
    name: "Premium Bluetooth Speaker",
    brand: "JBL",
    price: 78000,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 12,
    name: "Wireless Headphones",
    brand: "Sony",
    price: 65000,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
];



const formatPrice = (price: number) =>
  `₦${price.toLocaleString("en-NG")}`;

type PaymentMethod = "cod" | "online";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<number[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
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

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("sonama-wills-cart");

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);

        if (
          Array.isArray(parsed) &&
          parsed.every(
            (id) => typeof id === "number" && Number.isInteger(id)
          )
        ) {
          setCart(parsed);
        }
      }
    } catch {
      localStorage.removeItem("sonama-wills-cart");
    }

    setCartLoaded(true);
  }, []);

  const cartItems = useMemo(() => {
    return products
      .filter((product) => cart.includes(product.id))
      .map((product) => ({
        ...product,
        quantity: cart.filter((id) => id === product.id).length,
      }));
  }, [cart]);

  const subtotal = cartItems.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const placeOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add products before checking out.");
      return;
    }

    if (!/^[0-9+\s()-]{7,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (paymentMethod === "online") {
      setError(
        "Demo only: online payment is not connected. Select Cash on Delivery to complete this demonstration order."
      );
      return;
    }

    setIsSubmitting(true);

    const newOrderNumber = `SW-${Date.now().toString().slice(-8)}`;

    const order = {
      orderNumber: newOrderNumber,
      customer: form,
      items: cartItems,
      subtotal,
      paymentMethod,
      status: "Order received",
      createdAt: new Date().toISOString(),
    };

    try {
      const previousOrders = JSON.parse(
        localStorage.getItem("sonama-wills-orders") || "[]"
      );

      if (!Array.isArray(previousOrders)) {
        throw new Error("Invalid order history");
      }

      localStorage.setItem(
        "sonama-wills-orders",
        JSON.stringify([order, ...previousOrders])
      );

      localStorage.removeItem("sonama-wills-cart");
      setCart([]);
      setOrderNumber(newOrderNumber);
    } catch {
      setError(
        "We couldn't save your  order. Please check your browser storage and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cartLoaded) {
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
            Your demonstration order has been saved in this browser.
            No payment has been collected and no real delivery has been scheduled.
          </p>

          <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-left">
            <p className="text-xs font-semibold text-gray-500">
              ORDER NUMBER
            </p>
            <p className="mt-2 text-xl font-black text-[#1769e0]">
              {orderNumber}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="text-sm text-gray-500">Order total</span>
              <span className="font-black text-[#142d4e]">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Payment method: Cash on Delivery
            </p>
          </div>
           
           <button
            onClick={() => router.push("/track-order")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e87928] px-6 py-4 font-bold text-white transition hover:bg-[#cf641b]"
          >
            Track My Order
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#1769e0] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
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
            Enter your details to complete your demonstration order.
          </p>
        </div>

        {cartItems.length === 0 ? (
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
              onClick={() => router.push("/")}
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
                      onChange={(e) => updateField("fullName", e.target.value)}
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
                      onChange={(e) => updateField("email", e.target.value)}
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
                      onChange={(e) => updateField("phone", e.target.value)}
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
                      onChange={(e) => updateField("address", e.target.value)}
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
                      onChange={(e) => updateField("city", e.target.value)}
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
                      onChange={(e) => updateField("state", e.target.value)}
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
                      onChange={(e) => updateField("notes", e.target.value)}
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
                      paymentMethod === "cod"
                        ? "border-[#1769e0] bg-blue-50/60"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 accent-[#1769e0]"
                    />
                    <div>
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Demonstration order. No actual delivery is scheduled.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                      paymentMethod === "online"
                        ? "border-[#1769e0] bg-blue-50/60"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="mt-1 accent-[#1769e0]"
                    />
                    <div>
                      <p className="font-bold">Online Payment</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Preview only. A real payment gateway is not connected.
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <aside className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
              <h2 className="text-lg font-black">Your order</h2>
              <p className="mt-1 text-xs text-gray-500">
                {cart.reduce((total, id) => total + 1, 0)}{" "}
                {cart.length === 1 ? "item" : "items"} in your cart
              </p>

              <div className="mt-6 space-y-5">
                {cartItems.map((product) => (
                  <div key={product.id} className="flex gap-3">
                    <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#142d4e] px-1 text-xs font-bold text-white">
                        {product.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {product.brand}
                      </p>
                      <h3 className="mt-1 text-sm font-bold leading-5">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm font-black text-[#142d4e]">
                        {formatPrice(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-3 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-semibold">To be confirmed</span>
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
                disabled={isSubmitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1769e0] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-gray-400">
                <Truck size={15} /> Delivery details are for demonstration only
              </p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

