"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CartDrawer from "@/components/CartDrawer";

import {
  getCart,
  addToCart as addProductToCart,
  getCartCount,
  subscribeToCart,
  type CartItem,
} from "@/lib/cart";

import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  MessageCircle,
  ShieldCheck,
  Truck,
  Headphones,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug?: string | null;
  category: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  image_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  description?: string | null;
  features?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85";

const DEFAULT_FEATURES = [
  "Designed for everyday use",
  "Practical and convenient design",
  "Suitable for modern homes",
  "Contact us to confirm product specifications",
];

const formatPrice = (price: number) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

function formatProduct(data: any): Product {
  return {
    id: String(data.id),
    name: data.name ?? "Unnamed Product",
    slug: data.slug ?? null,
    category: data.category ?? "Other",
    sku: data.sku ?? null,
    price: Number(data.price ?? 0),
    stock_quantity: Number(data.stock_quantity ?? 0),
    image_url: data.image_url || FALLBACK_IMAGE,
image_urls: Array.isArray(data.image_urls)
  ? data.image_urls.filter(
      (url: unknown): url is string =>
        typeof url === "string" && url.trim().length > 0
    )
  : [],
    is_active: Boolean(data.is_active),
    is_featured: Boolean(data.is_featured),
    description: data.description ?? null,
    features: Array.isArray(data.features)
      ? data.features.filter(
          (feature: unknown): feature is string =>
            typeof feature === "string"
        )
      : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

function ProductDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const productId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Fetch product details and related products.
  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setLoadError("Product ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    setProduct(null);
    setRelatedProducts([]);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Supabase product error:", error);

        throw new Error(
          [error.message, error.details, error.hint]
            .filter(Boolean)
            .join(" — ") || "Failed to retrieve product."
        );
      }

      if (!data) {
        setProduct(null);
        return;
      }

      const selectedProduct = formatProduct(data);
        setProduct(selectedProduct);
        setActiveImageIndex(0);

      const {
        data: relatedData,
        error: relatedError,
      } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .neq("id", productId)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (relatedError) {
        console.error("Related products error:", relatedError);
      } else {
        setRelatedProducts(
          (relatedData ?? []).map((item: any) => formatProduct(item))
        );
      }
    } catch (error: unknown) {
      console.error("Failed to load product:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "We couldn't load this product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [productId, supabase]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct, retryCount]);

  // Load and synchronize the shared cart.
  useEffect(() => {
    setCart(getCart());

    return subscribeToCart(() => {
      setCart(getCart());
    });
  }, []);

  // Add product to the shared cart.
  const handleAddToCart = () => {
    if (!product || product.stock_quantity <= 0) return;

    const existingItem = cart.find(
      (item) => item.id === product.id
    );

    const currentQuantity = existingItem?.quantity ?? 0;

    if (currentQuantity + quantity > product.stock_quantity) {
      window.alert(
        `Only ${product.stock_quantity} unit(s) are currently available.`
      );
      return;
    }

    addProductToCart(product, quantity);

    setCart(getCart());
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  // WhatsApp enquiry.
  const enquireOnWhatsApp = () => {
    if (!product) return;

    const message = `Hello, I am interested in the ${product.name}, listed at ${formatPrice(product.price)}. Please confirm availability and delivery options.`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Loading state.
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-5 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#1769e0]" />

        <h1 className="mt-5 text-xl font-black text-[#142d4e]">
          Loading product...
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Please wait while we retrieve the product details.
        </p>
      </main>
    );
  }

  // Error state.
  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <RefreshCw size={28} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-[#142d4e]">
          Unable to load product
        </h1>

        <p className="mt-3 max-w-lg break-words text-sm leading-6 text-gray-500">
          {loadError}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setRetryCount((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1769e0] px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <button
            onClick={() => router.push("/products")}
            className="rounded-full border border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
          >
            View All Products
          </button>
        </div>
      </main>
    );
  }

  // Product not found.
  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#1769e0]">
          <ShoppingCart size={28} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-gray-900">
          Product Not Found
        </h1>

        <p className="mt-3 max-w-md text-gray-500">
          This product may have been removed or is no longer available.
        </p>

        <button
          onClick={() => router.push("/products")}
          className="mt-6 rounded-full bg-[#1769e0] px-6 py-3 font-bold text-white transition hover:bg-blue-700"
        >
          Browse Products
        </button>
      </main>
    );
  }

  const productImages = [
  product.image_url || FALLBACK_IMAGE,
  ...product.image_urls.filter(
    (url) => url !== product.image_url
  ),
];

const activeImage =
  productImages[activeImageIndex] || FALLBACK_IMAGE;

const showPreviousImage = () => {
  setActiveImageIndex((current) =>
    current === 0 ? productImages.length - 1 : current - 1
  );
};

const showNextImage = () => {
  setActiveImageIndex((current) =>
    current === productImages.length - 1 ? 0 : current + 1
  );
};

const handleGalleryTouchStart = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  setTouchStartX(event.touches[0].clientX);
};

const handleGalleryTouchEnd = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  if (touchStartX === null) return;

  const difference = event.changedTouches[0].clientX - touchStartX;

  if (Math.abs(difference) > 50) {
    if (difference < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  }

  setTouchStartX(null);
};

  const inStock = product.stock_quantity > 0;

  const features =
    product.features && product.features.length > 0
      ? product.features
      : DEFAULT_FEATURES;

  const cartQuantity =
    cart.find((item) => item.id === product.id)?.quantity ?? 0;

  const totalCartQuantity = getCartCount(cart);

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171923]">
      {/* Announcement bar */}
      <div className="bg-[#142d4e] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Quality home appliances. Shopping made simple.
      </div>

     {/* Header */}
<header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
  <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-3 sm:h-[84px] sm:px-8 lg:px-12">

    {/* SONAMA WILLS Logo */}
    <button
      onClick={() => router.push("/")}
      className="shrink-0 transition-transform duration-300 hover:scale-[1.02]"
      aria-label="Return to homepage"
    >
      <img
        src="/images/logo3.png"
        alt="SONAMA WILLS - Home of All Appliances"
        className="h-14 w-auto max-w-[200px] object-contain sm:h-20 sm:max-w-[280px]"
      />
    </button>

    {/* Shopping Cart */}
    <button
      onClick={() => setCartOpen(true)}
      aria-label="Open shopping cart"
      className="relative flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-bold transition hover:border-blue-200 hover:bg-blue-50 sm:h-11 sm:px-4"
    >
      <ShoppingCart size={19} />

      <span className="hidden sm:inline">Cart</span>

      {totalCartQuantity > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1769e0] px-1 text-[10px] text-white">
          {totalCartQuantity}
        </span>
      )}
    </button>

  </div>
</header>
      {/* Product details */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 sm:pb-24 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
         {/* Product Image Gallery */}
<div className="space-y-4">
  <div
    className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[26px] border border-gray-100 bg-white p-8 sm:min-h-[480px] sm:p-12"
    onTouchStart={handleGalleryTouchStart}
    onTouchEnd={handleGalleryTouchEnd}
  >
    <span
      className={`absolute left-5 top-5 z-10 rounded-full px-4 py-2 text-[10px] font-black tracking-[0.15em] ${
        !inStock
          ? "bg-red-50 text-red-600"
          : product.is_featured
            ? "bg-blue-50 text-[#1769e0]"
            : "bg-green-50 text-green-700"
      }`}
    >
      {!inStock
        ? "OUT OF STOCK"
        : product.is_featured
          ? "FEATURED"
          : "AVAILABLE"}
    </span>

    {/* Main image */}
    <img
      key={activeImage}
      src={activeImage}
      alt={`${product.name} - Image ${activeImageIndex + 1}`}
      className="max-h-[420px] w-full object-contain"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = FALLBACK_IMAGE;
      }}
    />

    {/* Previous image */}
    {productImages.length > 1 && (
      <>
        <button
          type="button"
          onClick={showPreviousImage}
          aria-label="Previous product image"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/90 text-gray-800 shadow-md transition hover:bg-[#1769e0] hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Next image */}
        <button
          type="button"
          onClick={showNextImage}
          aria-label="Next product image"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white/90 text-gray-800 shadow-md transition hover:bg-[#1769e0] hover:text-white"
        >
          <ArrowRight size={18} />
        </button>

        {/* Image counter */}
        <span className="absolute right-5 top-5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white">
          {activeImageIndex + 1}/{productImages.length}
        </span>
      </>
    )}

    <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
      <ShieldCheck size={16} className="text-[#1769e0]" />
      Quality-focused selection
    </div>
  </div>

  {/* Image thumbnails */}
  {productImages.length > 1 && (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {productImages.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => setActiveImageIndex(index)}
          aria-label={`View product image ${index + 1}`}
          aria-pressed={activeImageIndex === index}
          className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-2 transition sm:h-24 sm:w-24 ${
            activeImageIndex === index
              ? "border-[#1769e0] shadow-md"
              : "border-gray-100 hover:border-blue-200"
          }`}
        >
          <img
            src={image}
            alt={`${product.name} thumbnail ${index + 1}`}
            className="h-full w-full object-contain"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </button>
      ))}
    </div>
  )}
</div>

          {/* Product information */}
          <div className="flex flex-col justify-center py-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1769e0]">
              {product.sku
                ? `${product.sku} · ${product.category}`
                : product.category}
            </p>

            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black tracking-tight text-[#1769e0] sm:text-4xl">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="mt-7 h-px bg-gray-200" />

            <p className="mt-7 text-sm leading-7 text-gray-600 sm:text-base">
              {product.description ||
                `Discover the ${product.name} at Sonama Wills. Contact us to confirm product specifications, availability, and delivery options before purchasing.`}
            </p>

            {/* Product highlights */}
            <div className="mt-7">
              <h2 className="text-sm font-black text-gray-900">
                Product Highlights
              </h2>

              <ul className="mt-4 space-y-3">
                {features.map((feature, index) => (
                  <li
                    key={`${feature}-${index}`}
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

            {/* Stock information */}
            <div
              className={`mt-6 flex items-center gap-2 text-sm font-semibold ${
                inStock ? "text-green-700" : "text-red-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  inStock ? "bg-green-500" : "bg-red-500"
                }`}
              />

              {inStock
                ? `${product.stock_quantity} unit(s) available`
                : "Currently out of stock"}
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
                    setQuantity((current) =>
                      Math.min(
                        99,
                        product.stock_quantity,
                        current + 1
                      )
                    )
                  }
                  disabled={
                    !inStock ||
                    quantity >= 99 ||
                    quantity >= product.stock_quantity
                  }
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1769e0] text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                onClick={handleAddToCart}
                disabled={
                  !inStock ||
                  cartQuantity + quantity > product.stock_quantity
                }
                className="flex items-center justify-center gap-2 rounded-full bg-[#1769e0] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                {!inStock ? (
                  <>
                    <ShoppingCart size={19} />
                    Out of Stock
                  </>
                ) : added ? (
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
                onClick={() => setCartOpen(true)}
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
                <ShieldCheck size={20} className="shrink-0 text-[#1769e0]" />

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
                <Headphones size={20} className="shrink-0 text-[#1769e0]" />

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

        {/* Related products */}
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
              onClick={() => router.push("/products")}
              className="text-sm font-bold text-[#1769e0] transition hover:text-blue-800"
            >
              View All Products →
            </button>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/products/${item.id}`)}
                  className="group overflow-hidden rounded-[22px] border border-gray-100 bg-white text-left transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-[220px] items-center justify-center bg-[#f3f5f8] p-6">
                    <img
                      src={item.image_url || FALLBACK_IMAGE}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {item.category}
                    </p>

                    <h3 className="mt-2 font-bold text-gray-900">
                      {item.name}
                    </h3>

                    <p className="mt-3 text-lg font-black text-[#1769e0]">
                      {formatPrice(item.price)}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition group-hover:text-[#1769e0]">
                      View Product <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-7 rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
              There are no other products to recommend right now.
            </p>
          )}
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

      {/* Shared cart drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
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