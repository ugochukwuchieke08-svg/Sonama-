"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";


import {
  getCart,
  addToCart,
  getCartCount,
  subscribeToCart,
  type CartItem,
} from "@/lib/cart";

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
  Zap,
  Plus,
  RotateCcw,
  ChevronDown,
  Package,
  Tv,
  Waves,
  Snowflake,
  UserRound,
  Wind,
  Clock,
  PackageCheck,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  sku: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  is_active: boolean;
  logo_url: string | null;
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=85";

const categoryImages: Record<string, string> = {
  Televisions:
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
  Refrigerators:
    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=700&q=85",
  "Washing Machines":
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=700&q=85",
  Freezers:
    "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=700&q=85",
  "Air Conditioners":
    "https://images.unsplash.com/photo-1631545806609-7e8c4c7c3d9b?auto=format&fit=crop&w=700&q=85",
};

const categoryIcons: Record<string, typeof Tv> = {
  Televisions: Tv,
  Refrigerators: Package,
  "Washing Machines": Waves,
  Freezers: Snowflake,
  "Air Conditioners": Wind,
};

const brandBackgrounds: Record<string, string> = {
  samsung: "from-blue-950 via-blue-800 to-blue-600",
  lg: "from-red-950 via-red-800 to-red-600",
  hisense: "from-emerald-950 via-emerald-800 to-teal-600",
  tcl: "from-orange-950 via-orange-800 to-red-600",
  sony: "from-gray-950 via-gray-800 to-gray-600",
  panasonic: "from-blue-950 via-indigo-800 to-blue-600",
  philips: "from-cyan-950 via-cyan-800 to-blue-600",
  toshiba: "from-red-950 via-red-800 to-rose-600",
  haier: "from-sky-950 via-sky-800 to-cyan-600",
  bosch: "from-gray-950 via-red-900 to-red-700",
  midea: "from-blue-950 via-blue-800 to-cyan-600",
  whirlpool: "from-indigo-950 via-blue-900 to-blue-600",
};

const formatPrice = (price: number) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

export default function Home() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [activeBrand, setActiveBrand] = useState("All Brands");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  const supabase = createClient();

  supabase.auth.getUser().then(({ data }) => {
    setIsLoggedIn(!!data.user);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsLoggedIn(!!session?.user);
  });

  return () => subscription.unsubscribe();
}, []);

  // Scroll reveal animations
  useEffect(() => {
    const root = document.documentElement;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.remove("motion-ready");
      document
        .querySelectorAll("[data-reveal]")
        .forEach((element) => element.classList.add("is-visible"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((element) => element.classList.add("is-visible"));
      return;
    }

    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    const observeElements = () => {
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        if (!element.classList.contains("is-visible")) {
          observer.observe(element);
        }
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver(observeElements);

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  // Fetch products, brands and promotions
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");

    try {
      const [
        productsResult,
        brandsResult,
        promotionsResult,
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, category, brand, sku, price, stock_quantity, image_url, is_active, is_featured, created_at"
          )
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("brands")
          .select("id, name, slug, categories, is_active, logo_url")
          .eq("is_active", true)
          .order("name", { ascending: true }),

        supabase
          .from("promotions")
          .select(
            "id, title, description, discount_label, image_url, button_text, button_url"
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);

      if (productsResult.error) throw productsResult.error;

      if (brandsResult.error) {
        console.error("Failed to fetch brands:", brandsResult.error);
        setBrands([]);
      } else {
        setBrands(brandsResult.data ?? []);
      }

      if (promotionsResult.error) {
        console.error("Failed to fetch promotions:", promotionsResult.error);
        setPromotions([]);
      } else {
        setPromotions(promotionsResult.data ?? []);
      }

      const formattedProducts: Product[] = (
        productsResult.data ?? []
      ).map((product) => ({
        id: String(product.id),
        name: product.name,
        category: product.category,
        brand: product.brand?.trim() || null,
        sku: product.sku ?? null,
        price: Number(product.price),
        stock_quantity: Number(product.stock_quantity ?? 0),
        image_url: product.image_url || FALLBACK_IMAGE,
        is_active: product.is_active,
        is_featured: product.is_featured,
        created_at: product.created_at,
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Failed to fetch SONAMA WILLS products:", error);

      setProductsError(
        "We couldn't load our products. Please check your connection and try again."
      );
    } finally {
      setProductsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Synchronise cart
  useEffect(() => {
    const syncCart = () => setCart(getCart());

    syncCart();

    return subscribeToCart(syncCart);
  }, []);

  // WhatsApp product enquiry
  const orderOnWhatsApp = (product: Product) => {
    const message = `Hello, I am interested in the ${product.name}, listed at ${formatPrice(
      product.price
    )}. Please confirm availability.`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Dynamic categories
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category?.trim())
          .filter((category): category is string => Boolean(category))
      ),
    ];

    return [
      { name: "All Products", icon: Zap },
      ...uniqueCategories.map((name) => ({
        name,
        icon: categoryIcons[name] ?? PackageCheck,
      })),
    ];
  }, [products]);

  // Product filtering
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        product.category === activeCategory;

      const matchesBrand =
        activeBrand === "All Brands" ||
        product.brand?.toLowerCase() === activeBrand.toLowerCase();

      const matchesSearch = `${product.name} ${product.category} ${
        product.brand ?? ""
      } ${product.sku ?? ""}`
        .toLowerCase()
        .includes(query);

      return matchesCategory && matchesBrand && matchesSearch;
    });
  }, [products, activeCategory, activeBrand, search]);

  const featuredProducts = useMemo(
    () => filteredProducts.filter((product) => product.is_featured),
    [filteredProducts]
  );

  const displayedProducts =
    featuredProducts.length > 0 &&
    !search &&
    activeCategory === "All Products" &&
    activeBrand === "All Brands"
      ? featuredProducts.slice(0, 8)
      : filteredProducts.slice(0, 8);

  const cartCount = getCartCount(cart);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    addToCart(product);
  };

  // Category selection
  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setActiveBrand("All Brands");
    setMobileMenu(false);

    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All Products");
    setActiveBrand("All Brands");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#172033]">
      {/* Announcement bar */}
      <div className="relative overflow-hidden bg-[#102746] px-4 py-2.5 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">
        <span className="announcement-shimmer">
          Discover quality electronics and appliances at SONAMA WILLS STORE.
          <span className="ml-2 text-blue-200">
            Shop your favourites today.
          </span>
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-4 py-4 sm:px-8 lg:px-12">
          <a href="/" className="shrink-0 transition-transform duration-300 hover:scale-[1.02]">
            <span className="block text-xl font-black tracking-tight sm:text-2xl">
              SONAMA WILLS
              <span className="text-[#1769e0]"> STORE</span>
            </span>

            <span className="mt-0.5 block text-[8px] font-bold tracking-[0.3em] text-gray-400">
              ELECTRONICS & HOME
            </span>
          </a>

          {/* Desktop search */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("shop")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="hidden flex-1 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 transition duration-300 focus-within:border-[#1769e0] focus-within:bg-white focus-within:shadow-md focus-within:shadow-blue-100 md:flex"
          >
            <Search size={19} className="shrink-0 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for televisions, refrigerators, washing machines..."
              aria-label="Search products"
              className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />

            <button
              type="submit"
              className="ml-3 shrink-0 rounded-md bg-[#1769e0] px-5 py-2.5 text-xs font-bold text-white transition duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
            >
              Search
            </button>
          </form>

          {/* Cart and mobile menu */}
          <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0">

            <a
  href={isLoggedIn ? "/account" : "/login"}
  className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 transition duration-300 hover:border-blue-200 hover:bg-blue-50"
>
  <UserRound size={20} className="text-[#1769e0]" />

  <span className="hidden text-sm font-semibold text-gray-700 sm:inline">
    {isLoggedIn ? "My Account" : "Login"}
  </span>
</a>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-cart-pop items-center justify-center rounded-full bg-[#1769e0] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenu((previous) => !previous)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden border-t border-gray-100 lg:block">
          <div className="mx-auto flex max-w-[1500px] items-center gap-8 px-12">
            <a
              href="/"
              className="nav-link-active border-b-[3px] border-[#1769e0] py-4 text-xs font-bold text-[#1769e0]"
            >
              HOME
            </a>

            <a
              href="#shop"
              className="nav-link py-4 text-xs font-bold text-gray-600"
            >
              ALL PRODUCTS
            </a>

            {categories
              .filter((category) => category.name !== "All Products")
              .slice(0, 6)
              .map((category) => (
                <button
                  key={category.name}
                  onClick={() => selectCategory(category.name)}
                  className="nav-link flex items-center gap-1 whitespace-nowrap py-4 text-xs font-bold text-gray-600"
                >
                  {category.name.toUpperCase()}
                  <ChevronDown size={13} />
                </button>
              ))}

            <a
              href="#contact"
              className="nav-link ml-auto py-4 text-xs font-bold text-gray-600"
            >
              CONTACT
            </a>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="mobile-menu-panel border-t border-gray-100 bg-white px-5 py-5 lg:hidden">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setMobileMenu(false);

                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="mb-5 flex items-center rounded-lg border border-gray-200 px-3 py-3"
            >
              <Search size={18} className="text-gray-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="ml-3 w-full bg-transparent text-sm outline-none"
              />
            </form>

            <div className="flex flex-col">
              <a
                href="/"
                onClick={() => setMobileMenu(false)}
                className="border-b border-gray-100 py-3 text-sm font-bold"
              >
                Home
              </a>

              <a
  href={isLoggedIn ? "/account" : "/login"}
  onClick={() => setMobileMenu(false)}
  className="flex items-center gap-3 border-b border-gray-100 py-3 text-sm font-bold text-gray-700"
>
  <UserRound size={18} className="text-[#1769e0]" />
  {isLoggedIn ? "My Account" : "Login / Register"}
</a>

              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <button
                    key={category.name}
                    onClick={() => selectCategory(category.name)}
                    className="flex items-center gap-3 border-b border-gray-100 py-3 text-left text-sm font-medium text-gray-600"
                  >
                    <Icon size={18} className="text-[#1769e0]" />
                    {category.name}
                  </button>
                );
              })}

              <a
                href="#contact"
                onClick={() => setMobileMenu(false)}
                className="py-3 text-sm font-bold"
              >
                Contact Us
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1500px] px-4 pt-5 sm:px-8 lg:px-12 lg:pt-8">
        <div className="hero-section relative min-h-[430px] overflow-hidden rounded-xl bg-[#102746] sm:min-h-[500px] lg:min-h-[570px]">
          <img
            src={FALLBACK_IMAGE}
            alt="Modern television in a stylish living room"
            className="hero-image absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1c32] via-[#102746]/90 to-[#102746]/10" />

          <div className="hero-glow pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-blue-400/20 blur-[100px]" />

          <div className="relative z-10 flex min-h-[430px] max-w-3xl flex-col justify-center px-6 py-14 sm:min-h-[500px] sm:px-12 lg:min-h-[570px] lg:px-16">
            <span className="hero-content hero-delay-1 mb-6 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-blue-100 backdrop-blur sm:text-xs">
              <Zap size={14} />
              UPGRADE YOUR EVERYDAY
            </span>

            <h1 className="hero-content hero-delay-2 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[68px]">
              Make Every
              <br />
              Moment Better
              <br />
              <span className="text-[#70b2ff]">With Great Tech.</span>
            </h1>

            <p className="hero-content hero-delay-3 mt-6 max-w-lg text-sm leading-7 text-gray-200 sm:text-base sm:leading-8">
              Explore televisions, refrigerators, washing machines and
              quality home appliances for a more comfortable lifestyle.
            </p>

            <div className="hero-content hero-delay-4 mt-8 flex flex-wrap gap-3">
              <a
                href="#shop"
                className="group inline-flex items-center gap-3 rounded-md bg-[#1769e0] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/30"
              >
                Shop Now
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-md border border-white/40 px-7 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                Explore Categories
              </a>
            </div>

            <div className="hero-content hero-delay-4 mt-10 flex flex-wrap gap-6 text-xs font-medium text-gray-200">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-300" />
                Quality-focused shopping
              </span>

              <span className="flex items-center gap-2">
                <Truck size={17} className="text-blue-300" />
                Delivery options
              </span>
            </div>
          </div>

          <div className="hero-floating absolute bottom-8 right-8 hidden max-w-[210px] rounded-xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-md xl:block">
            <p className="text-xs text-blue-100">SONAMA WILLS STORE</p>

            <p className="mt-2 text-lg font-bold">
              Better choices for your home.
            </p>

            <a
              href="#categories"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold"
            >
              Explore now <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* Service benefits */}
      <section
        data-reveal
        className="mx-auto grid max-w-[1500px] grid-cols-2 border-b border-gray-100 px-4 py-7 sm:px-8 md:grid-cols-4 lg:px-12"
      >
        {[
          {
            icon: ShieldCheck,
            title: "Quality Products",
            text: "Carefully selected appliances",
          },
          {
            icon: Truck,
            title: "Delivery Options",
            text: "Ask about your location",
          },
          {
            icon: Headphones,
            title: "Customer Support",
            text: "We're here to assist",
          },
          {
            icon: PackageCheck,
            title: "Easy Shopping",
            text: "Simple ordering experience",
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className={`benefit-item flex items-center gap-3 px-3 py-4 sm:px-5 ${
              index > 1 ? "border-t border-gray-100 md:border-t-0" : ""
            } ${
              index % 2 === 1 ? "border-l border-gray-100" : ""
            } ${index === 2 ? "md:border-l" : ""}`}
          >
            <span className="benefit-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1769e0]">
              <item.icon size={21} />
            </span>

            <div>
              <p className="text-xs font-bold sm:text-sm">{item.title}</p>
              <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-[1500px] scroll-mt-36 px-4 py-12 sm:px-8 lg:px-12 lg:py-16"
      >
        <div data-reveal className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
              Explore our collection
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Shop by Category
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Find the right appliances for every part of your home.
            </p>
          </div>

          <button
            onClick={() => selectCategory("All Products")}
            className="hidden items-center gap-2 text-sm font-bold text-[#1769e0] transition hover:gap-3 sm:flex"
          >
            View all <ArrowRight size={16} />
          </button>
        </div>

        <div
          data-reveal
          className="reveal-stagger mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {categories
            .filter((category) => category.name !== "All Products")
            .map((category) => {
              const Icon = category.icon;
              const image = categoryImages[category.name] || FALLBACK_IMAGE;

              const count = products.filter(
                (product) => product.category === category.name
              ).length;

              return (
                <button
                  key={category.name}
                  onClick={() => selectCategory(category.name)}
                  className="category-card group overflow-hidden rounded-xl border border-gray-100 bg-white text-left transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-xl"
                >
                  <div className="relative h-32 overflow-hidden bg-gray-100 sm:h-40">
                    <img
                      src={image}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition duration-300 group-hover:from-black/50" />

                    <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1769e0] shadow transition duration-300 group-hover:rotate-12 group-hover:scale-110">
                      <Icon size={18} />
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold">{category.name}</h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {count} {count === 1 ? "product" : "products"}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        {categories.length <= 1 && !productsLoading && (
          <p className="mt-6 text-sm text-gray-500">
            Product categories will appear here when products are added.
          </p>
        )}
      </section>

      {/* Shop by Brand */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 pb-14 sm:px-8 lg:px-12">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
                Trusted names
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Shop by Brand
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Explore products from the brands available in our store.
              </p>
            </div>
          </div>

          <div
            data-reveal
            className="reveal-stagger mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {brands.map((brand) => {
              const count = products.filter(
                (product) =>
                  product.brand?.toLowerCase() === brand.name.toLowerCase()
              ).length;

              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    setActiveBrand(brand.name);
                    setActiveCategory("All Products");
                    setSearch("");

                    document.getElementById("shop")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className={`brand-card group relative flex h-48 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${
                    brandBackgrounds[brand.slug.toLowerCase()] ||
                    "from-slate-950 via-slate-800 to-slate-600"
                  } p-5 text-left shadow-md transition duration-500 hover:-translate-y-2 hover:shadow-2xl`}
                >
                  {/* Decorative elements */}
                  <div className="brand-orbit absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10 transition duration-700 group-hover:scale-150" />

                  <div className="brand-glow absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition duration-700 group-hover:scale-150" />

                  <div className="brand-shine pointer-events-none absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100" />

                  {/* Brand logo */}
                  <div className="relative z-10 flex flex-1 items-center justify-center">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={`${brand.name} logo`}
                        loading="lazy"
                        className="max-h-20 w-full max-w-[190px] object-contain brightness-0 invert transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-3xl font-black tracking-tight text-white">
                        {brand.name.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Brand information */}
                  <div className="relative z-10 flex items-end justify-between border-t border-white/20 pt-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        {brand.name}
                      </h3>

                      <p className="mt-1 text-xs text-white/70">
                        {count} {count === 1 ? "product" : "products"}
                      </p>
                    </div>

                    <span className="flex items-center gap-1 text-sm font-bold text-white transition duration-300 group-hover:translate-x-1">
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Products */}
      <section
        id="shop"
        className="scroll-mt-36 bg-[#f7f8fa] py-12 sm:py-16"
      >
        <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-12">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
                Discover something new
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {activeBrand !== "All Brands"
                  ? activeBrand
                  : activeCategory === "All Products"
                    ? "Featured Products"
                    : activeCategory}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Quality appliances for your home and everyday needs.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-[#1769e0]">
              {productsLoading
                ? "Loading..."
                : `${filteredProducts.length} products`}
            </span>
          </div>

          {/* Mobile search */}
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition focus-within:border-[#1769e0] md:hidden">
            <Search size={18} className="text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search appliances..."
              aria-label="Search products"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* Category filters */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  setActiveBrand("All Brands");
                }}
                className={`shrink-0 rounded-md px-4 py-2.5 text-xs font-bold transition duration-300 ${
                  activeCategory === category.name
                    ? "bg-[#1769e0] text-white shadow-md shadow-blue-200"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-[#1769e0]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Brand filters */}
          {brands.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveBrand("All Brands")}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeBrand === "All Brands"
                    ? "bg-[#142d4e] text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                }`}
              >
                All Brands
              </button>

              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.name)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeBrand === brand.name
                      ? "bg-[#142d4e] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200"
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          )}

          {/* Product loading error */}
          {productsError && (
            <div className="mt-8 rounded-xl border border-red-200 bg-white px-6 py-12 text-center">
              <p className="font-bold text-gray-900">
                Unable to load products
              </p>

              <p className="mt-2 text-sm text-gray-500">{productsError}</p>

              <button
                onClick={() => void fetchProducts()}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#1769e0] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {productsLoading && !productsError && (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-[330px] animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
          )}

          {/* Product listing */}
          {!productsLoading && !productsError && (
            <>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {displayedProducts.map((product) => (
                  <article
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="product-card group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-xl"
                  >
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#f3f5f8] p-3 sm:h-56 sm:p-5">
                      <span className="absolute left-2 top-2 z-10 rounded-sm bg-white px-2 py-1 text-[8px] font-black tracking-wide text-[#1769e0] shadow-sm sm:left-3 sm:top-3 sm:text-[9px]">
                        {product.is_featured
                          ? "FEATURED"
                          : product.stock_quantity > 0
                            ? "AVAILABLE"
                            : "OUT OF STOCK"}
                      </span>

                      <img
                        src={product.image_url || FALLBACK_IMAGE}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain transition duration-700 group-hover:scale-110"
                      />

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock_quantity <= 0}
                        aria-label={`Add ${product.name} to cart`}
                        className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1769e0] shadow-md transition duration-300 hover:scale-110 hover:bg-[#1769e0] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:bottom-3 sm:right-3 sm:h-10 sm:w-10"
                      >
                        <Plus size={19} />
                      </button>
                    </div>

                    <div className="p-3 sm:p-4">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px]">
                        {product.category}
                      </p>

                      {product.brand && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1769e0]">
                          {product.brand}
                        </p>
                      )}

                      <h3 className="mt-2 line-clamp-2 min-h-10 text-xs font-bold leading-5 text-gray-900 sm:text-sm">
                        {product.name}
                      </h3>

                      <p className="mt-3 text-sm font-black text-[#142d4e] sm:text-lg">
                        {formatPrice(product.price)}
                      </p>

                      <p
                        className={`mt-1 text-[10px] sm:text-xs ${
                          product.stock_quantity > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {product.stock_quantity > 0
                          ? "In stock"
                          : "Currently unavailable"}
                      </p>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          orderOnWhatsApp(product);
                        }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#1769e0] py-2.5 text-[10px] font-bold text-[#1769e0] transition duration-300 hover:bg-[#1769e0] hover:text-white sm:text-xs"
                      >
                        Enquire Now <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* No matching products */}
              {filteredProducts.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                  <Search className="mx-auto text-gray-400" size={32} />

                  <p className="mt-4 font-bold">
                    {products.length === 0
                      ? "No products available yet"
                      : "No matching products"}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Try another search or category.
                  </p>

                  <button
                    onClick={clearFilters}
                    className="mt-4 text-sm font-bold text-[#1769e0] transition hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* View all products */}
              {filteredProducts.length > displayedProducts.length && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => router.push("/products")}
                    className="group inline-flex items-center gap-3 rounded-md bg-[#1769e0] px-8 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-lg"
                  >
                    View All Products
                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Premium Promotions */}
      {promotions.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div data-reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#1769e0]">
                Exclusive store offers
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#142d4e] sm:text-4xl">
                Offers Worth Exploring.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-gray-500">
                Discover our latest promotions and find something special
                for your home.
              </p>
            </div>

            <a
              href="/products"
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#1769e0] transition hover:text-blue-800"
            >
              Explore Store
              <ArrowUpRight
                size={17}
                className="transition group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </a>
          </div>

          <div
            data-reveal
            className="reveal-stagger grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {promotions.map((promotion, index) => {
              const destination = promotion.button_url?.trim() || "/products";
              const isExternal = /^https?:\/\//i.test(destination);

              return (
                <article
                  key={promotion.id}
                  className={`promotion-card group relative isolate min-h-[370px] overflow-hidden rounded-[24px] bg-[#102746] shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl sm:min-h-[430px] ${
                    promotions.length === 1 ? "md:col-span-2" : ""
                  }`}
                >
                  {promotion.image_url && (
                    <img
                      src={promotion.image_url}
                      alt={promotion.title}
                      loading="lazy"
                      className="promotion-image absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}

                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10 transition duration-500 group-hover:from-black/75" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Decorative elements */}
                  <div className="promotion-orbit pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/15 transition duration-700 group-hover:scale-125" />

                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                  <div className="relative flex min-h-[370px] max-w-2xl flex-col items-start justify-center px-7 py-10 sm:min-h-[430px] sm:px-12 sm:py-14">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[10px]">
                        SONAMA WILLS EXCLUSIVE
                      </span>

                      {promotion.discount_label && (
                        <span className="rounded-full bg-[#1769e0] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                          {promotion.discount_label}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-7 max-w-xl text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {promotion.title}
                    </h3>

                    {promotion.description && (
                      <p className="mt-5 max-w-md text-sm leading-7 text-gray-200 sm:text-base">
                        {promotion.description}
                      </p>
                    )}

                    <a
                      href={destination}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="group/button mt-8 inline-flex items-center gap-4 rounded-lg bg-white px-6 py-4 text-xs font-extrabold text-[#142d4e] shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-[#1769e0] hover:text-white sm:px-7 sm:text-sm"
                    >
                      {promotion.button_text || "Shop Now"}

                      <ArrowUpRight
                        size={18}
                        className="transition duration-300 group-hover/button:translate-x-1 group-hover/button:-translate-y-1"
                      />
                    </a>

                    <div className="mt-10 flex items-center gap-3">
                      <span className="h-[2px] w-10 bg-[#70b2ff]" />

                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {String(promotions.length).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section
        id="why-us"
        className="border-y border-gray-100 bg-[#f8f9fb] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-[1500px] px-4 sm:px-8 lg:px-12">
          <div data-reveal className="mx-auto max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
              The SONAMA experience
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Shopping Made Simpler
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              We want finding the right home appliance to be a straightforward
              and convenient experience.
            </p>
          </div>

          <div
            data-reveal
            className="reveal-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: ShieldCheck,
                title: "Quality-focused",
                text: "Explore carefully selected electronics and home appliances.",
              },
              {
                icon: Truck,
                title: "Delivery information",
                text: "Contact our team to discuss delivery options for your location.",
              },
              {
                icon: Headphones,
                title: "Helpful support",
                text: "Get assistance when you need information about a product.",
              },
              {
                icon: Clock,
                title: "Convenient shopping",
                text: "Browse products and place your orders from wherever you are.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="why-card rounded-xl border border-gray-100 bg-white p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-xl"
              >
                <span className="why-icon flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#1769e0] transition duration-300">
                  <item.icon size={23} />
                </span>

                <h3 className="mt-5 text-sm font-bold">{item.title}</h3>

                <p className="mt-2 text-xs leading-6 text-gray-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="scroll-mt-24 bg-[#0d1d32] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-12 lg:py-16">
          <div>
            <a href="/" className="inline-block transition hover:opacity-80">
              <span className="text-xl font-black tracking-tight">
                SONAMA WILLS
                <span className="text-[#70b2ff]"> STORE</span>
              </span>

              <span className="mt-1 block text-[8px] font-bold tracking-[0.3em] text-gray-500">
                ELECTRONICS & HOME
              </span>
            </a>

            <p className="mt-5 max-w-xs text-sm leading-7 text-gray-400">
              Your destination for electronics and home appliances.
              Explore products for a more comfortable home.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Quick Links</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
              <a href="/" className="footer-link">
                Home
              </a>

              <a href="/products" className="footer-link">
                All Products
              </a>

              <a href="#categories" className="footer-link">
                Categories
              </a>

              <a href="#why-us" className="footer-link">
                Why Choose Us
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Customer Care</h3>

            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-400">
              <a href="#contact" className="footer-link">
                Contact Us
              </a>

              <a href="#shop" className="footer-link">
                Product Enquiries
              </a>

              <p>Ask us about delivery and warranty.</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Need Assistance?</h3>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              Contact our team to check product availability, pricing
              and delivery options.
            </p>

            <a
              href="https://wa.me/?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20your%20electronics."
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-xs font-bold text-[#142d4e] transition duration-300 hover:-translate-y-1 hover:bg-blue-50"
            >
              Enquire on WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-3 px-5 py-6 text-xs text-gray-500 sm:px-8 md:flex-row lg:px-12">
            <p>© 2026 SONAMA WILLS STORE. All rights reserved.</p>
            <p>Electronics & Home Appliances</p>
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {/* Animation styles */}
      <style jsx global>{`
        /* Scroll reveal */
        .motion-ready [data-reveal] {
          opacity: 0;
          transform: translateY(35px);
          transition:
            opacity 800ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .motion-ready [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Staggered children */
        .reveal-stagger > * {
          transition-delay: 0ms;
        }

        .reveal-stagger.is-visible > *:nth-child(1) {
          transition-delay: 80ms;
        }

        .reveal-stagger.is-visible > *:nth-child(2) {
          transition-delay: 150ms;
        }

        .reveal-stagger.is-visible > *:nth-child(3) {
          transition-delay: 220ms;
        }

        .reveal-stagger.is-visible > *:nth-child(4) {
          transition-delay: 290ms;
        }

        .reveal-stagger.is-visible > *:nth-child(5) {
          transition-delay: 360ms;
        }

        .reveal-stagger.is-visible > *:nth-child(6) {
          transition-delay: 430ms;
        }

        /* Hero image movement */
        .hero-image {
          animation: hero-image-zoom 18s ease-in-out infinite alternate;
          transform-origin: center;
        }

        @keyframes hero-image-zoom {
          from {
            transform: scale(1);
          }

          to {
            transform: scale(1.09);
          }
        }

        /* Hero text entrance */
        .hero-content {
          opacity: 0;
          animation: hero-content-enter 900ms cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        .hero-delay-1 {
          animation-delay: 150ms;
        }

        .hero-delay-2 {
          animation-delay: 300ms;
        }

        .hero-delay-3 {
          animation-delay: 450ms;
        }

        .hero-delay-4 {
          animation-delay: 600ms;
        }

        @keyframes hero-content-enter {
          from {
            opacity: 0;
            transform: translateY(28px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-floating {
          animation: floating-card 5s ease-in-out infinite;
        }

        @keyframes floating-card {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        .hero-glow {
          animation: glow-pulse 7s ease-in-out infinite alternate;
        }

        @keyframes glow-pulse {
          from {
            opacity: 0.4;
            transform: scale(0.9);
          }

          to {
            opacity: 0.8;
            transform: scale(1.15);
          }
        }

        /* Announcement shimmer */
        .announcement-shimmer {
          display: inline-block;
          animation: announcement-appear 1s ease-out both;
        }

        @keyframes announcement-appear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header navigation */
        .nav-link {
          position: relative;
          transition: color 250ms ease;
        }

        .nav-link::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 2px;
          background: #1769e0;
          content: "";
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 250ms ease;
        }

        .nav-link:hover {
          color: #1769e0;
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-link-active::after {
          display: none;
        }

        /* Mobile menu */
        .mobile-menu-panel {
          animation: mobile-menu-enter 250ms ease-out both;
          transform-origin: top;
        }

        @keyframes mobile-menu-enter {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Benefit icons */
        .benefit-icon {
          transition:
            transform 350ms ease,
            background 350ms ease;
        }

        .benefit-item:hover .benefit-icon {
          transform: rotate(-8deg) scale(1.1);
          background: #dbeafe;
        }

        /* Brand cards */
        .brand-orbit {
          transform: rotate(0deg);
        }

        .brand-card:hover .brand-orbit {
          transform: rotate(25deg) scale(1.2);
        }

        .brand-shine {
          background: linear-gradient(
            115deg,
            transparent 25%,
            rgba(255, 255, 255, 0.12) 45%,
            transparent 65%
          );
          transform: translateX(-100%);
        }

        .brand-card:hover .brand-shine {
          opacity: 1;
          transform: translateX(100%);
          transition:
            transform 900ms ease,
            opacity 300ms ease;
        }

        /* Product and category cards */
        .product-card,
        .category-card,
        .why-card {
          will-change: transform;
        }

        .product-card img,
        .category-card img {
          backface-visibility: hidden;
        }

        /* Promotion cards */
        .promotion-card {
          isolation: isolate;
        }

        .promotion-card .promotion-image {
          z-index: -2;
        }

        .promotion-orbit {
          z-index: -1;
        }

        /* Why us cards */
        .why-card:hover .why-icon {
          transform: rotate(-8deg) scale(1.1);
          background: #dbeafe;
        }

        /* Footer links */
        .footer-link {
          width: fit-content;
          transition:
            color 200ms ease,
            transform 200ms ease;
        }

        .footer-link:hover {
          color: white;
          transform: translateX(4px);
        }

        /* Cart count */
        @keyframes cart-pop {
          0% {
            transform: scale(0.5);
          }

          65% {
            transform: scale(1.2);
          }

          100% {
            transform: scale(1);
          }
        }

        .animate-cart-pop {
          animation: cart-pop 300ms ease-out;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .motion-ready [data-reveal] {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}