
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  Headphones,
  Star,
  Zap,
  Plus,
} from "lucide-react";
import Image from "next/image";

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
  },
];

const categories = [
  { name: "All Products", icon: "✦" },
  { name: "Televisions", icon: "▣" },
  { name: "Refrigerators", icon: "❄" },
  { name: "Washing Machines", icon: "◉" },
  { name: "Freezers", icon: "▤" },
  { name: "Air Conditioners", icon: "☼" },
];

const formatPrice = (price: number) =>
  `₦${price.toLocaleString("en-NG")}`;

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
 const [cart, setCart] = useState<number[]>([]);
const [cartLoaded, setCartLoaded] = useState(false);
const router = useRouter();

useEffect(() => {
  try {
    const savedCart = localStorage.getItem("sonama-wills-cart");

    if (savedCart) {
      const parsedCart: unknown = JSON.parse(savedCart);

      if (
        Array.isArray(parsedCart) &&
        parsedCart.every(
          (id) => typeof id === "number" && Number.isInteger(id)
        )
      ) {
        setCart(parsedCart);
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
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        product.category === activeCategory;

      const matchesSearch =
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const cartItems = products
  .filter((product) => cart.includes(product.id))
  .map((product) => ({
    ...product,
    quantity: cart.filter((id) => id === product.id).length,
  }));

const cartSubtotal = cartItems.reduce(
  (total, product) => total + product.price * product.quantity,
  0
);

const increaseQuantity = (productId: number) => {
  setCart((previous) => [...previous, productId]);
};

const decreaseQuantity = (productId: number) => {
  setCart((previous) => {
    const index = previous.indexOf(productId);

    if (index === -1) return previous;

    return previous.filter((_, i) => i !== index);
  });
};

const removeFromCart = (productId: number) => {
  setCart((previous) => previous.filter((id) => id !== productId));
};

  const orderOnWhatsApp = (product: (typeof products)[number]) => {
    const message = `Hello, I am interested in the ${product.name} by ${product.brand}, listed at ${formatPrice(product.price)}. Please confirm availability.`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171923]">
      {/* Announcement */}
      <div className="bg-[#142d4e] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Quality home appliances. Shopping made simple.
        <span className="ml-2 hidden text-blue-200 sm:inline">
          Discover your next upgrade →
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="#" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769e0] text-white shadow-lg shadow-blue-100">
              <Zap size={23} fill="white" />
            </span>
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              SONAMA<span className="text-[#1769e0]">WILLS</span>
              <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.24em] text-gray-400">
                ELECTRONICS & HOME
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-600 lg:flex">
            <a href="#" className="text-[#1769e0]">Home</a>
            <a href="#shop" className="transition hover:text-[#1769e0]">Shop</a>
            <a href="#categories" className="transition hover:text-[#1769e0]">Categories</a>
            <a href="#why-us" className="transition hover:text-[#1769e0]">Why Us</a>
            <a href="#contact" className="transition hover:text-[#1769e0]">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center rounded-full border border-gray-200 px-3 py-2 md:flex">
              <Search size={17} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  document.getElementById("shop")?.scrollIntoView();
                }}
                placeholder="Find electronics..."
                aria-label="Search products"
                className="w-36 bg-transparent pl-2 text-xs outline-none"
              />
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition hover:bg-blue-50"
              aria-label={`Shopping cart, ${cart.length} items`}
            >
              <ShoppingCart size={19} />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1769e0] px-1 text-[10px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              className="flex h-10 w-10 items-center justify-center lg:hidden"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="flex flex-col gap-4 border-t border-gray-100 bg-white px-6 py-5 text-sm font-semibold lg:hidden">
            <a href="#" onClick={() => setMobileMenu(false)}>Home</a>
            <a href="#shop" onClick={() => setMobileMenu(false)}>Shop</a>
            <a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a>
            <a href="#why-us" onClick={() => setMobileMenu(false)}>Why Us</a>
            <a href="#contact" onClick={() => setMobileMenu(false)}>Contact</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="px-4 pt-5 sm:px-8 sm:pt-8 lg:px-12">
        <div className="relative mx-auto flex min-h-[450px] max-w-[1440px] overflow-hidden rounded-[26px] bg-[#102746] sm:min-h-[510px] lg:min-h-[570px]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1800&q=90"
              alt="Modern television in a stylish living room"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1d33] via-[#102746]/90 to-[#102746]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1d33]/50 to-transparent" />
          </div>

          <div className="relative z-10 flex max-w-3xl flex-col justify-center px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
            <span className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold tracking-[0.19em] text-blue-100 backdrop-blur sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              YOUR HOME. YOUR UPGRADE.
            </span>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[68px]">
              Better Living
              <br />
              Starts with
              <br />
              <span className="text-[#70b2ff]">Better Tech.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-gray-200 sm:text-base sm:leading-8">
              Discover televisions, home appliances and everyday essentials
              selected to make your home more comfortable.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#shop"
                className="inline-flex items-center gap-3 rounded-full bg-[#2479f5] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-500"
              >
                Explore Products <ArrowRight size={18} />
              </a>
              <a
                href="#categories"
                className="rounded-full border border-white/30 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Categories
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-gray-200 sm:gap-x-8">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-300" /> Quality-focused
              </span>
              <span className="flex items-center gap-2">
                <Truck size={17} className="text-blue-300" /> Delivery options
              </span>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 hidden rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-lg md:block lg:bottom-10 lg:right-10">
            <p className="text-xs font-medium text-blue-100">Find your next</p>
            <p className="mt-1 text-lg font-bold">Home essential.</p>
            <a href="#shop" className="mt-3 flex items-center gap-2 text-xs font-semibold">
              Shop the collection <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-12 lg:py-10">
        {[
          { icon: ShieldCheck, title: "Quality Products", text: "Shop with confidence" },
          { icon: Truck, title: "Delivery Options", text: "Ask about your location" },
          { icon: Headphones, title: "Customer Support", text: "We're here to help" },
          { icon: Star, title: "Carefully Selected", text: "Appliances for your home" },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769e0]">
              <item.icon size={21} />
            </span>
            <div>
              <p className="text-xs font-bold sm:text-sm">{item.title}</p>
              <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">{item.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">Find what you need</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Shop by Category</h2>
          </div>
          <a href="#shop" className="hidden items-center gap-2 text-sm font-bold text-[#1769e0] sm:flex">
            All products <ArrowRight size={16} />
          </a>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setActiveCategory(category.name);
                document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-xs font-bold transition sm:text-sm ${
                activeCategory === category.name
                  ? "border-[#1769e0] bg-[#1769e0] text-white shadow-lg shadow-blue-100"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-[#1769e0]"
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="shop" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">Our selection</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Featured Products</h2>
            <p className="mt-2 text-sm text-gray-500">Explore appliances for every part of your home.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769e0]">
            {filteredProducts.length} products
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 md:hidden">
          <Search size={18} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TVs, freezers, brands..."
            aria-label="Search products"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredProducts.map((product) => (
           <article
            key={product.id}
            onClick={() => router.push(`/products/${product.id}`)}
            className="group cursor-pointer overflow-hidden rounded-[22px] border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-gray-200/60"
          >

              <div className="relative flex h-[250px] items-center justify-center overflow-hidden bg-[#f3f5f8] p-5 sm:h-[280px]">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-[9px] font-black tracking-wider text-[#1769e0] shadow-sm">
                  {product.badge}
                </span>
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                />
                <button
                 onClick={(e) => {
                    e.stopPropagation();
                    setCart((previous) => [...previous, product.id]);
                  }}
                  aria-label={`Add ${product.name} to cart`}
                  className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1769e0] shadow-lg transition hover:bg-[#1769e0] hover:text-white"
                >
                  <Plus size={21} />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-400">
                  {product.brand} · {product.category}
                </p>
                <h3 className="mt-2 text-base font-bold leading-6 text-gray-900">{product.name}</h3>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-lg font-black tracking-tight text-[#142d4e]">
                      {formatPrice(product.price)}
                    </p>
                    {product.oldPrice && (
                      <p className="mt-1 text-xs text-gray-400 line-through">
                        {formatPrice(product.oldPrice)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      orderOnWhatsApp(product);
                    }}
                    className="rounded-full bg-[#1769e0] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1255b9]"
                  >
                    Enquire Now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <Search className="mx-auto text-gray-400" size={32} />
            <p className="mt-4 font-bold">No matching products</p>
            <p className="mt-2 text-sm text-gray-500">Try another search or category.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All Products");
              }}
              className="mt-4 text-sm font-bold text-[#1769e0]"
            >
              Clear filters
            </button>
          </div>
          
        )}
      </section>

    <div className="mt-10 flex justify-center">
      <button
        onClick={() => router.push("/products")}
        className="group inline-flex items-center gap-3 rounded-full border-2 border-[#1769e0] bg-white px-8 py-4 text-sm font-bold text-[#1769e0] shadow-sm transition duration-300 hover:bg-[#1769e0] hover:text-white hover:shadow-lg hover:shadow-blue-200/50"
      >
        See All Products
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </button>
    </div>


      {/* Promotional banner */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[26px] bg-[#eaf2ff] px-6 py-10 sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">Make home feel better</span>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              The right appliances.
              <br />
              The better everyday.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">
              Looking for something specific? Speak with our team about product options and availability.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#1769e0] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Talk to our team <ArrowRight size={18} />
            </a>
          </div>
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/60 sm:h-96 sm:w-96" />
          <div className="absolute -bottom-28 right-36 h-64 w-64 rounded-full bg-blue-200/40" />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="scroll-mt-24 bg-[#0d1d32] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-12 lg:py-16">
          <div>
            <a href="#" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769e0]">
                <Zap size={22} fill="white" />
              </span>
              <span className="text-xl font-black tracking-tight">
                SONAMA<span className="text-[#70b2ff]">WILLS</span>
              </span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-7 text-gray-400">
              Your destination for quality electronics and home appliances. Find what you need for a more comfortable home.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Quick Links</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Home</a>
              <a href="#shop" className="hover:text-white">Shop Products</a>
              <a href="#categories" className="hover:text-white">Categories</a>
              <a href="#why-us" className="hover:text-white">Why Choose Us</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Customer Care</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#contact" className="hover:text-white">Contact Us</a>
              <a href="#shop" className="hover:text-white">Product Enquiries</a>
              <p>Ask us about delivery and warranty.</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Need assistance?</h3>
            <p className="mt-4 text-sm leading-7 text-gray-400">
              Contact our team to check product availability, pricing and delivery options.
            </p>
            <a
              href="https://wa.me/?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20your%20electronics."
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-[#142d4e] transition hover:bg-blue-50"
            >
              Enquire on WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 px-5 py-6 text-xs text-gray-500 sm:px-8 md:flex-row lg:px-12">
            <p>© 2026 SONAMA WILLS. All rights reserved.</p>
          </div>
        </div>
      </footer>
            {/* Shopping Cart Drawer */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Your Cart
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {cart.length} {cart.length === 1 ? "item" : "items"} selected
                </p>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping cart"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl transition hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Discover quality electronics and add your favourites to
                    your cart.
                  </p>

                  <button
                    onClick={() => {
                      setCartOpen(false);
                      document
                        .getElementById("shop")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-6 rounded-full bg-[#1769e0] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((product) => (
                    <article
                      key={product.id}
                      className="flex gap-4 border-b border-gray-100 pb-6"
                    >
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {product.brand}
                        </p>

                        <h3 className="mt-1 text-sm font-bold leading-5 text-gray-900">
                          {product.name}
                        </h3>

                        <p className="mt-2 text-base font-black text-[#142d4e]">
                          {formatPrice(product.price * product.quantity)}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-gray-200">
                            <button
                              onClick={() => decreaseQuantity(product.id)}
                              aria-label={`Decrease ${product.name} quantity`}
                              className="flex h-8 w-8 items-center justify-center text-lg transition hover:bg-gray-100"
                            >
                              −
                            </button>

                            <span className="min-w-8 text-center text-xs font-bold">
                              {product.quantity}
                            </span>

                            <button
                              onClick={() => increaseQuantity(product.id)}
                              aria-label={`Increase ${product.name} quantity`}
                              className="flex h-8 w-8 items-center justify-center text-lg transition hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-xs font-semibold text-red-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 bg-white px-6 py-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>

                  <span className="text-xl font-black text-gray-900">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Delivery fees, if applicable, will be calculated at checkout.
                </p>

                <button
                 onClick={() => {
                    setCartOpen(false);
                    router.push("/checkout");
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-[#1769e0] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => setCartOpen(false)}
                  className="mt-3 w-full py-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

