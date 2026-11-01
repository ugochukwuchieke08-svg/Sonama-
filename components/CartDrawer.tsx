"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
X,
Minus,
Plus,
Trash2,
ShoppingBag,
ArrowRight,
Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
CartItem,
getCart,
getCartCount,
removeFromCart,
subscribeToCart,
updateCartQuantity,
} from "@/lib/cart";

type Product = {
id: string;
name: string;
category: string;
price: number;
stock_quantity: number;
image_url: string | null;
is_active: boolean;
};

type CartDrawerProps = {
isOpen: boolean;
onClose: () => void;
};

export default function CartDrawer({
isOpen,
onClose,
}: CartDrawerProps) {
const router = useRouter();
const supabase = createClient();

const [cart, setCart] = useState<CartItem[]>([]);
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(false);

const syncCart = useCallback(() => {
setCart(getCart());
}, []);

useEffect(() => {
syncCart();
return subscribeToCart(syncCart);
}, [syncCart]);

useEffect(() => {
if (!isOpen) return;

let cancelled = false;

async function fetchProducts() {
  setLoading(true);

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, price, stock_quantity, image_url, is_active"
    )
    .eq("is_active", true);

  if (cancelled) return;

  if (error) {
    console.error("Unable to load cart products:", error);
    setProducts([]);
  } else {
    setProducts(data || []);
  }

  setLoading(false);
}

fetchProducts();

return () => {
  cancelled = true;
};

}, [isOpen, supabase]);

const cartProducts = cart
.map((item) => {
const product = products.find(
(product) => product.id === item.id
);

  if (!product) return null;

  return {
    ...product,
    quantity: item.quantity,
  };
})
.filter(
  (item): item is Product & { quantity: number } =>
    item !== null
);

const subtotal = cartProducts.reduce(
(total, item) => total + Number(item.price) * item.quantity,
0
);

const cartCount = getCartCount(cart);

const formatPrice = (price: number) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

function changeQuantity(
productId: string,
quantity: number,
stockQuantity: number
) {
updateCartQuantity(productId, quantity, stockQuantity);
}

function handleRemove(productId: string) {
removeFromCart(productId);
}

function handleCheckout() {
onClose();
router.push("/checkout");
}

return (
<>
<div
  onClick={onClose}
  className={`fixed inset-0 z-[90] bg-black/50 transition-opacity duration-300 ${
    isOpen
      ? "visible opacity-100"
      : "invisible opacity-0"
  }`}
/>

  <aside
    className={`fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}
    aria-hidden={!isOpen}
  >
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Your Cart
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close cart"
        className="rounded-full bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200"
      >
        <X size={20} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-5">
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2
            className="animate-spin text-gray-500"
            size={28}
          />
        </div>
      ) : cart.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-5 rounded-full bg-gray-100 p-6">
            <ShoppingBag
              size={36}
              className="text-gray-400"
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900">
            Your cart is empty
          </h3>

          <p className="mt-2 max-w-xs text-sm text-gray-500">
            Looks like you haven't added anything to your
            cart yet.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      ) : cartProducts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">
            Your cart products are currently unavailable.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {cartProducts.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-gray-100 pb-6"
            >
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={
                    item.image_url ||
                    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300"
                  }
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      {item.category}
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
                      {item.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="text-gray-400 transition hover:text-red-500"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <p className="mt-2 text-sm font-bold text-gray-900">
                  {formatPrice(item.price)}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(
                          item.id,
                          item.quantity - 1,
                          item.stock_quantity
                        )
                      }
                      aria-label="Decrease quantity"
                      className="p-2 transition hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="min-w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(
                          item.id,
                          item.quantity + 1,
                          item.stock_quantity
                        )
                      }
                      disabled={
                        item.quantity >= item.stock_quantity
                      }
                      aria-label="Increase quantity"
                      className="p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(
                      Number(item.price) * item.quantity
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {cartProducts.length > 0 && (
      <div className="border-t border-gray-100 px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Subtotal
          </span>

          <span className="text-lg font-bold text-gray-900">
            {formatPrice(subtotal)}
          </span>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Delivery charges are calculated at checkout.
        </p>

        <button
          type="button"
          onClick={handleCheckout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          Continue Shopping
        </button>
      </div>
    )}
  </aside>
</>

);
}