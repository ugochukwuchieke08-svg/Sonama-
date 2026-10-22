
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  ShoppingCart,
  ShoppingBag,
  SlidersHorizontal,
  Check,
  X,
  Zap,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "55-inch Smart 4K UHD TV",
    brand: "Samsung",
    category: "Televisions",
    price: 685000,
    oldPrice: 750000,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85",
    badge: "BEST SELLER",
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
    badge: "SALE",
  },
  {
    id: 3,
    name: "Front Load Washing Machine",
    brand: "LG",
    category: "Washing Machines",
    price: 420000,
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85",
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
    badge: "SALE",
  },
  {
    id: 5,
    name: "Split Air Conditioner",
    brand: "LG",
    category: "Air Conditioners",
    price: 490000,
    image:
      "https://images.unsplash.com/photo-1631545806609-8c3c3b0b0c93?auto=format&fit=crop&w=900&q=85",
    badge: "POPULAR",
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
    badge: "SALE",
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
    badge: "SALE",
  },
  {
    id: 8,
    name: "Premium Electric Blender",
    brand: "Binatone",
    category: "Kitchen Appliances",
    price: 48000,
    image:
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=85",
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
    badge: "SALE",
  },
  {
    id: 10,
    name: "Cordless Vacuum Cleaner",
    brand: "Samsung",
    category: "Home Appliances",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=85",
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
    badge: "POPULAR",
  },
  {
    id: 12,
    name: "Wireless Headphones",
    brand: "Sony",
    category: "Audio",
    price: 65000,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
];

const formatPrice = (price: number) =>
  `₦${price.toLocaleString("en-NG")}`;

const categories = [
  "All Products",
  ...Array.from(new Set(products.map((product) => product.category))),
];

export default function ProductsPage() {
  const router = useRouter();

  const [cart, setCart] = useState<number[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [sortBy, setSortBy] = useState("featured");
  const [addedProduct, setAddedProduct] = useState<number | null>(null);

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

  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem("sonama-wills-cart", JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        product.category === activeCategory;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.brand.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeCategory, search, sortBy]);

  const addToCart = (productId: number) => {
    setCart((previous) => [...previous, productId]);
    setAddedProduct(productId);
    window.setTimeout(() => setAddedProduct(null), 1400);
  };

  const cartCount = cart.length;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#171923]">
      {/* Announcement bar */}
      <div className="bg-[#142d4e] px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">
        <Zap size={13} className="mr-1 inline text-amber-400" />
        QUALITY ELECTRONICS. EXCEPTIONAL VALUE. &nbsp; FREE DELIVERY ON SELECTED ORDERS
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button
            onClick={() => router.push("/")}
            className="shrink-0 text-left text-lg font-black tracking-tight sm:text-2xl"
          >
            SONAMA<span className="text-[#1769e0]">WILLS</span>
            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.25em] text-gray-400">
              ELECTRONICS & HOME
            </span>
          </button>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-md">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, brands..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#1769e0] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="hidden items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#1769e0] sm:flex"
            >
              <ArrowLeft size={16} />
              Home
            </button>

            <button
              onClick={() => router.push("/checkout")}
              aria-label="View cart and checkout"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#1769e0] text-white transition hover:bg-blue-700"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#e87928] px-1 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-5 pb-4 md:hidden">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#1769e0]"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#142d4e]">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#e87928]/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
              <ShoppingBag size={13} />
              The complete collection
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Shop All
              <span className="block text-[#78b3ff]">Products.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100/75 sm:text-base">
              Discover thoughtfully selected electronics and home appliances
              designed to bring more comfort, entertainment, and convenience
              into your everyday life.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5 text-xs font-semibold text-blue-100/90">
              <span>✓ Carefully selected products</span>
              <span>✓ Great-value offers</span>
              <span>✓ Convenient shopping</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="text-3xl font-black text-white">12+</p>
              <p className="mt-2 text-xs text-blue-100/70">Featured products</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="text-3xl font-black text-white">6</p>
              <p className="mt-2 text-xs text-blue-100/70">Product categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1769e0]">
              Find your favourites
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#142d4e] sm:text-3xl">
              Explore our collection
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Showing {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-gray-600">
            <SlidersHorizontal size={17} />
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1769e0]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>
        </div>

        {/* Category filters */}
        <div className="mt-7 flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                activeCategory === category
                  ? "bg-[#1769e0] text-white shadow-lg shadow-blue-100"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-[#1769e0]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const quantity = cart.filter((id) => id === product.id).length;
              const justAdded = addedProduct === product.id;

              return (
                <article
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-gray-200/60 sm:rounded-[22px]"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f5f6f8] p-4 sm:p-6">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    />

                    {product.badge && (
                      <span
                        className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[8px] font-black tracking-wide sm:left-3 sm:top-3 sm:text-[9px] ${
                          product.badge === "SALE"
                            ? "bg-[#fff0e5] text-[#d76520]"
                            : "bg-[#e5efff] text-[#1769e0]"
                        }`}
                      >
                        {product.badge}
                      </span>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        addToCart(product.id);
                      }}
                      aria-label={`Add ${product.name} to cart`}
                      className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition sm:bottom-3 sm:right-3 ${
                        justAdded
                          ? "bg-green-600 text-white"
                          : "bg-white text-[#142d4e] hover:bg-[#1769e0] hover:text-white"
                      }`}
                    >
                      {justAdded ? <Check size={18} /> : <ShoppingCart size={17} />}
                    </button>

                    {quantity > 0 && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-[#142d4e] px-2.5 py-1 text-[10px] font-bold text-white">
                        {quantity} in cart
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 sm:p-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-gray-400 sm:text-[10px]">
                      {product.brand} · {product.category}
                    </p>

                    <h3 className="mt-2 min-h-[40px] text-sm font-bold leading-5 text-[#142d4e] transition group-hover:text-[#1769e0] sm:min-h-0 sm:text-[15px]">
                      {product.name}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-black text-[#142d4e] sm:text-base">
                        {formatPrice(product.price)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-[10px] text-gray-400 line-through sm:text-xs">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </div>

                    {product.oldPrice && (
                      <p className="mt-1 text-[10px] font-semibold text-green-600">
                        Save {formatPrice(product.oldPrice - product.price)}
                      </p>
                    )}

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/products/${product.id}`);
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-[11px] font-bold text-gray-700 transition hover:border-[#1769e0] hover:bg-[#1769e0] hover:text-white sm:text-xs"
                    >
                      View Details <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center">
            <Search size={34} className="mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-black text-[#142d4e]">
              No products found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try another search or select a different category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All Products");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1769e0] px-5 py-3 text-sm font-bold text-white"
            >
              <X size={16} /> Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Bottom banner */}
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16">
        <div className="flex flex-col justify-between gap-6 overflow-hidden rounded-[28px] bg-[#eaf2ff] p-7 sm:p-10 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1769e0]">
              Upgrade your everyday
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-black leading-tight text-[#142d4e] sm:text-3xl">
              The right electronics make all the difference.
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Explore our collection and find something perfect for your home.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1769e0] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Back to Home <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#101f34] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-black">
              SONAMA<span className="text-[#78b3ff]">WILLS</span>
            </p>
            <p className="mt-1 text-xs text-white/50">
              Electronics & Home Appliances
            </p>
          </div>
          <p className="text-xs text-white/40">
            © 2026 SONAMA WILLS. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

