"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  getCartItemKey,
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
  installation_available: boolean;
  installation_price: number;
  kit_available: boolean;
  kit_price: number;
  insurance_available: boolean;
};

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

type CartProduct = Product &
  CartItem & {
    itemKey: string;
    installationCost: number;
    kitCost: number;
    insuranceCost: number;
    unitTotal: number;
    lineTotal: number;
  };

export default function CartDrawer({
  isOpen,
  onClose,
}: CartDrawerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

  // Always read the latest cart when the drawer opens.
  setCart(getCart());

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        category,
        price,
        stock_quantity,
        image_url,
        is_active,
        installation_available,
        installation_price,
        kit_available,
        kit_price,
        insurance_available
      `)
      .eq("is_active", true);

    if (cancelled) return;

    if (error) {
      console.error("Unable to load cart products:", error);
      setProducts([]);
    } else {
      setProducts(
        (data ?? []).map((product: any) => ({
          ...product,
          price: Number(product.price ?? 0),
          stock_quantity: Number(product.stock_quantity ?? 0),
          installation_available: Boolean(product.installation_available),
          installation_price: Number(product.installation_price ?? 0),
          kit_available: Boolean(product.kit_available),
          kit_price: Number(product.kit_price ?? 0),
          insurance_available: Boolean(product.insurance_available),
        }))
      );
    }

    setLoading(false);
  }

  fetchProducts();

  return () => {
    cancelled = true;
  };
}, [isOpen, supabase]);

  const cartProducts: CartProduct[] = cart
    .map((item) => {
      const product = products.find(
        (product) => product.id === item.id
      );

      if (!product) return null;

      const installationCost =
        item.installationSelected && product.installation_available
          ? product.installation_price
          : 0;

      const kitCost =
        item.kitSelected && product.kit_available
          ? product.kit_price
          : 0;

      const insuranceCost =
        item.insuranceSelected && product.insurance_available
          ? product.price * 0.05
          : 0;

      const unitTotal =
        product.price +
        installationCost +
        kitCost +
        insuranceCost;

      return {
        ...product,
        ...item,
        itemKey: getCartItemKey(item),
        installationCost,
        kitCost,
        insuranceCost,
        unitTotal,
        lineTotal: unitTotal * item.quantity,
      };
    })
    .filter(
      (item): item is CartProduct => item !== null
    );

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.lineTotal,
    0
  );

  const cartCount = getCartCount(cart);

  const formatPrice = (price: number) =>
    `₦${Number(price || 0).toLocaleString("en-NG")}`;

  function changeQuantity(
    itemKey: string,
    quantity: number,
    stockQuantity: number
  ) {
    updateCartQuantity(itemKey, quantity, stockQuantity);
  }

  function handleRemove(itemKey: string) {
    removeFromCart(itemKey);
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
                  key={item.itemKey}
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
                        onClick={() => handleRemove(item.itemKey)}
                        aria-label={`Remove ${item.name}`}
                        className="text-gray-400 transition hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <p className="mt-2 text-sm font-bold text-gray-900">
                      {formatPrice(item.price)}{" "}
                      <span className="text-xs font-normal text-gray-500">
                        per unit
                      </span>
                    </p>

                    {/* Selected extras */}
                    {(item.installationSelected ||
                      item.kitSelected ||
                      item.insuranceSelected) && (
                      <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3">
                        {item.installationSelected &&
                          item.installation_available && (
                            <div className="flex justify-between gap-2 text-xs">
                              <span className="text-gray-600">
                                Installation
                              </span>
                              <span className="font-semibold text-gray-900">
                                {formatPrice(item.installationCost)}
                              </span>
                            </div>
                          )}

                        {item.kitSelected &&
                          item.kit_available && (
                            <div className="flex justify-between gap-2 text-xs">
                              <span className="text-gray-600">
                                Accessories / Kit
                              </span>
                              <span className="font-semibold text-gray-900">
                                {formatPrice(item.kitCost)}
                              </span>
                            </div>
                          )}

                        {item.insuranceSelected &&
                          item.insurance_available && (
                            <div className="flex justify-between gap-2 text-xs">
                              <span className="text-gray-600">
                                Product Insurance (5%)
                              </span>
                              <span className="font-semibold text-gray-900">
                                {formatPrice(item.insuranceCost)}
                              </span>
                            </div>
                          )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.itemKey,
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
                              item.itemKey,
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
                        {formatPrice(item.lineTotal)}
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