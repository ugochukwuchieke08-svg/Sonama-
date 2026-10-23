"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
ArrowLeft,
ShoppingCart,
MessageCircle,
ShieldCheck,
Truck,
Headphones,
CheckCircle2,
Plus,
Minus,
} from "lucide-react";

const products = [
{
id: 1,
name: "55-inch Smart 4K UHD TV",
brand: "Samsung",
category: "Televisions",
price: 685000,
oldPrice: 750000,
image:
"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85",
badge: "BESTSELLER",
description:
"Upgrade your entertainment experience with this Samsung Smart 4K UHD television. Enjoy detailed picture quality, immersive viewing, and a modern design suited to contemporary living spaces.",
features: [
"4K Ultra HD picture quality",
"Smart TV entertainment experience",
"Wide-screen viewing",
"Modern, space-saving design",
],
},
{
id: 2,
name: "Double Door Refrigerator",
brand: "Hisense",
category: "Refrigerators",
price: 545000,
oldPrice: 600000,
image:
"https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=85",
badge: "POPULAR",
description:
"Keep your groceries organised with this Hisense double-door refrigerator. Its spacious design provides convenient storage for everyday food and household essentials.",
features: [
"Spacious refrigerator storage",
"Convenient double-door design",
"Organised food compartments",
"Suitable for everyday home use",
],
},
{
id: 3,
name: "Front Load Washing Machine",
brand: "LG",
category: "Washing Machines",
price: 420000,
oldPrice: null,
image:
"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85",
badge: "QUALITY PICK",
description:
"Make laundry more convenient with this LG front-load washing machine. Its practical design helps simplify regular laundry routines while fitting neatly into a modern home.",
features: [
"Front-loading design",
"Convenient laundry operation",
"Modern appliance styling",
"Designed for household laundry",
],
},
{
id: 4,
name: "Modern Chest Freezer",
brand: "Haier Thermocool",
category: "Freezers",
price: 335000,
oldPrice: 370000,
image:
"https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=85",
badge: "GREAT VALUE",
description:
"Get extra frozen-food storage with this Haier Thermocool chest freezer. Its practical design makes it a useful addition to homes and businesses that need additional freezer space.",
features: [
"Spacious chest-style storage",
"Convenient top-opening design",
"Suitable for home or business use",
"Practical everyday storage solution",
],
},
{
id: 5,
name: "Split Air Conditioner",
brand: "LG",
category: "Air Conditioners",
price: 490000,
oldPrice: null,
image:
"https://images.unsplash.com/photo-1631545806609-8c3c3b0b0c93?auto=format&fit=crop&w=900&q=85",
badge: "TOP PICK",
description:
"Create a more comfortable indoor environment with this LG split air conditioner. Its wall-mounted design complements modern interiors and keeps your space looking neat.",
features: [
"Wall-mounted split design",
"Contemporary appearance",
"Designed for indoor comfort",
"Suitable for residential spaces",
],
},
{
id: 6,
name: "Premium Smart Television",
brand: "Hisense",
category: "Televisions",
price: 475000,
oldPrice: 520000,
image:
"https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=900&q=85",
badge: "SPECIAL OFFER",
description:
"Bring entertainment into your living room with this Hisense premium television. Its sleek appearance and large-screen viewing make it an attractive addition to a modern home.",
features: [
"Premium television design",
"Large-screen entertainment",
"Modern living-room styling",
"Designed for everyday viewing",
],
},


{
  id: 7,
  name: "Compact Microwave Oven",
  brand: "Samsung",
  category: "Kitchen Appliances",
  price: 145000,
  oldPrice: 165000,
  image:
    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=85",
  badge: "GREAT VALUE",
  description:
    "Make everyday cooking and reheating more convenient with this compact Samsung microwave oven. Its practical size and modern styling make it a useful addition to a contemporary kitchen.",
  features: [
    "Compact countertop design",
    "Convenient everyday reheating",
    "Modern kitchen appearance",
    "Suitable for everyday home use",
  ],
},
{
  id: 8,
  name: "Premium Electric Blender",
  brand: "Binatone",
  category: "Kitchen Appliances",
  price: 48000,
  oldPrice: null,
  image:
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=85",
  badge: "POPULAR",
  description:
    "Prepare smoothies, blend ingredients and simplify everyday food preparation with this Binatone electric blender.",
  features: [
    "Convenient electric blending",
    "Useful for everyday food preparation",
    "Practical kitchen appliance",
    "Compact countertop styling",
  ],
},
{
  id: 9,
  name: "Automatic Coffee Maker",
  brand: "Philips",
  category: "Kitchen Appliances",
  price: 92000,
  oldPrice: 110000,
  image:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
  badge: "SPECIAL OFFER",
  description:
    "Enjoy a convenient coffee-making experience at home with this Philips coffee maker, designed to complement modern kitchens.",
  features: [
    "Convenient coffee preparation",
    "Modern kitchen-friendly design",
    "Suitable for home use",
    "Designed for everyday convenience",
  ],
},
{
  id: 10,
  name: "Cordless Vacuum Cleaner",
  brand: "Samsung",
  category: "Home Appliances",
  price: 185000,
  oldPrice: null,
  image:
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=85",
  badge: "TOP PICK",
  description:
    "Make household cleaning more convenient with this Samsung cordless vacuum cleaner, featuring a modern design suited to everyday home cleaning.",
  features: [
    "Cordless-style cleaning convenience",
    "Modern appliance design",
    "Suitable for household cleaning",
    "Designed for convenient handling",
  ],
},
{
  id: 11,
  name: "Premium Bluetooth Speaker",
  brand: "JBL",
  category: "Audio",
  price: 78000,
  oldPrice: 95000,
  image:
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  badge: "BESTSELLER",
  description:
    "Bring your favourite music into your space with this JBL Bluetooth speaker, offering a portable audio option with a stylish appearance.",
  features: [
    "Bluetooth audio connectivity",
    "Portable speaker design",
    "Suitable for music and entertainment",
    "Modern appearance",
  ],
},
{
  id: 12,
  name: "Wireless Headphones",
  brand: "Sony",
  category: "Audio",
  price: 65000,
  oldPrice: null,
  image:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  badge: "QUALITY PICK",
  description:
    "Enjoy your personal listening experience with these Sony wireless headphones, designed for everyday entertainment and a comfortable listening setup.",
  features: [
    "Wireless listening convenience",
    "Over-ear headphone styling",
    "Suitable for music and entertainment",
    "Designed for everyday use",
  ],
},
];

const formatPrice = (price: number) =>
`₦${price.toLocaleString("en-NG")}`;

function ProductDetailsContent() {
const params = useParams();
const router = useRouter();

const productId = Number(params.id);

const product = products.find((item) => item.id === productId);

const [cart, setCart] = useState<number[]>([]);
const [quantity, setQuantity] = useState(1);
const [added, setAdded] = useState(false);

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


}, []);

const addToCart = () => {
if (!product) return;


const updatedCart = [
  ...cart,
  ...Array(quantity).fill(product.id),
];

setCart(updatedCart);
localStorage.setItem(
  "sonama-wills-cart",
  JSON.stringify(updatedCart)
);

setAdded(true);

window.setTimeout(() => {
  setAdded(false);
}, 2500);


};

const enquireOnWhatsApp = () => {
if (!product) return;


const message = `Hello, I am interested in the ${product.name} by ${product.brand}, listed at ${formatPrice(product.price)}. Please confirm availability and delivery options.`;

window.open(
  `https://wa.me/?text=${encodeURIComponent(message)}`,
  "_blank",
  "noopener,noreferrer"
);


};

if (!product) {
return ( <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-5 text-center"> <h1 className="text-3xl font-black text-gray-900">
Product Not Found </h1>


    <p className="mt-3 text-gray-500">
      The product you are looking for may no longer be available.
    </p>

    <button
      onClick={() => router.push("/")}
      className="mt-6 rounded-full bg-[#1769e0] px-6 py-3 font-bold text-white transition hover:bg-blue-700"
    >
      Return to Shop
    </button>
  </main>
);


}

return ( <main className="min-h-screen bg-[#fafafa] text-[#171923]">
{/* Announcement bar */} <div className="bg-[#142d4e] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
Quality home appliances. Shopping made simple. </div>

  {/* Header */}
  <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
    <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2.5"
        aria-label="Return to homepage"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769e0] text-sm font-black text-white shadow-lg shadow-blue-100">
          SW
        </span>

        <span className="text-lg font-black tracking-tight sm:text-2xl">
          SONAMA<span className="text-[#1769e0]">WILLS</span>
          <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.24em] text-gray-400">
            ELECTRONICS & HOME
          </span>
        </span>
      </button>

      <button
        onClick={() => router.push("/checkout")}
        className="relative flex items-center gap-2 rounded-full bg-gray-100 px-4 py-3 text-sm font-bold transition hover:bg-blue-50"
      >
        <ShoppingCart size={18} />
        <span className="hidden sm:inline">Cart</span>

        {cart.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1769e0] px-1 text-[10px] text-white">
            {cart.length}
          </span>
        )}
      </button>
    </div>
  </header>

  {/* Breadcrumb */}
  <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8 lg:px-12">
    <button
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#1769e0]"
    >
      <ArrowLeft size={17} />
      Back to Shop
    </button>

    <p className="mt-4 text-xs font-medium text-gray-400">
      Home <span className="mx-2">/</span>
      {product.category}
      <span className="mx-2">/</span>
      <span className="text-gray-700">{product.brand}</span>
    </p>
  </div>

  {/* Product details */}
  <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 sm:pb-24 lg:px-12">
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
      {/* Product image */}
      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[26px] border border-gray-100 bg-white p-8 sm:min-h-[480px] sm:p-12">
        <span className="absolute left-5 top-5 rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-[#1769e0]">
          {product.badge}
        </span>

        <img
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          className="max-h-[420px] w-full object-contain"
        />

        <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
          <ShieldCheck size={16} className="text-[#1769e0]" />
          Quality-focused selection
        </div>
      </div>

      {/* Product information */}
      <div className="flex flex-col justify-center py-2">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1769e0]">
          {product.brand} · {product.category}
        </p>

        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {product.name}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-black tracking-tight text-[#1769e0] sm:text-4xl">
            {formatPrice(product.price)}
          </span>

          {product.oldPrice && (
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}

          {product.oldPrice && (
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
              Save{" "}
              {formatPrice(product.oldPrice - product.price)}
            </span>
          )}
        </div>

        <div className="mt-7 h-px bg-gray-200" />

        <p className="mt-7 text-sm leading-7 text-gray-600 sm:text-base">
          {product.description}
        </p>

        <div className="mt-7">
          <h2 className="text-sm font-black text-gray-900">
            Product Highlights
          </h2>

          <ul className="mt-4 space-y-3">
            {product.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm text-gray-600"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-[#1769e0]"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Quantity selector */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Quantity
          </p>

          <div className="flex w-fit items-center gap-5 rounded-full border border-gray-200 bg-white p-1.5">
            <button
              onClick={() =>
                setQuantity((current) => Math.max(1, current - 1))
              }
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={16} />
            </button>

            <span className="min-w-5 text-center text-sm font-bold">
              {quantity}
            </span>

            <button
              onClick={() =>
                setQuantity((current) => Math.min(99, current + 1))
              }
              disabled={quantity >= 99}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1769e0] text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Subtotal:{" "}
          <span className="font-bold text-gray-900">
            {formatPrice(product.price * quantity)}
          </span>
        </p>

        {/* Action buttons */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={addToCart}
            className="flex items-center justify-center gap-2 rounded-full bg-[#1769e0] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
          >
            {added ? (
              <>
                <CheckCircle2 size={19} />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart size={19} />
                Add to Cart
              </>
            )}
          </button>

          <button
            onClick={enquireOnWhatsApp}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-gray-800 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
          >
            <MessageCircle size={19} />
            Enquire on WhatsApp
          </button>
        </div>

        {added && (
          <button
            onClick={() => router.push("/checkout")}
            className="mt-3 w-full rounded-full bg-green-50 px-5 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100"
          >
            View Cart & Continue
          </button>
        )}

        {/* Service highlights */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Truck size={20} className="shrink-0 text-[#1769e0]" />
            <div>
              <p className="text-xs font-bold text-gray-900">
                Delivery Options
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                Ask about your location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck
              size={20}
              className="shrink-0 text-[#1769e0]"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">
                Product Information
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                Confirm before purchase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Headphones
              size={20}
              className="shrink-0 text-[#1769e0]"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">
                Customer Support
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                We're here to help
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* More products */}
    <div className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1769e0]">
            Explore more
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            You May Also Like
          </h2>
        </div>

        <button
          onClick={() => router.push("/")}
          className="text-sm font-bold text-[#1769e0] transition hover:text-blue-800"
        >
          View All Products →
        </button>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products
          .filter((item) => item.id !== product.id)
          .slice(0, 3)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/products/${item.id}`)}
              className="group overflow-hidden rounded-[22px] border border-gray-100 bg-white text-left transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-[220px] items-center justify-center bg-[#f3f5f8] p-6">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {item.brand} · {item.category}
                </p>

                <h3 className="mt-2 font-bold text-gray-900">
                  {item.name}
                </h3>

                <p className="mt-3 text-lg font-black text-[#1769e0]">
                  {formatPrice(item.price)}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-[#102746] px-5 py-10 text-white sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <p className="text-xl font-black">
          SONAMA<span className="text-[#70b2ff]">WILLS</span>
        </p>

        <p className="mt-2 text-xs text-blue-100/70">
          Electronics & Home · Better living starts here.
        </p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="flex w-fit items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
      >
        <ArrowLeft size={16} />
        Back to Homepage
      </button>
    </div>

    <div className="mx-auto mt-8 max-w-[1440px] border-t border-white/10 pt-5 text-xs text-blue-100/60">
      © 2026 SONAMA WILLS. All rights reserved.
    </div>
  </footer>
</main>


);
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm font-semibold text-gray-500">
          Loading product...
        </main>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}
