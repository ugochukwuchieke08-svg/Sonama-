export const CART_STORAGE_KEY = "sonama-wills-cart";
export const CART_UPDATED_EVENT = "sonama-cart-updated";

export type CartItem = {
  id: string;
  quantity: number;
};

export type CartProduct = {
  id: string;
  stock_quantity: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isValidId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    id.trim().length > 0
  );
}

function isValidQuantity(quantity: unknown): quantity is number {
  return (
    typeof quantity === "number" &&
    Number.isSafeInteger(quantity) &&
    quantity > 0
  );
}

function normalizeCart(items: unknown[]): CartItem[] {
  const quantities = new Map<string, number>();

  for (const item of items) {
    let id: string;
    let quantity: number;

    // Current format: { id, quantity }
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "quantity" in item
    ) {
      const cartItem = item as CartItem;

      if (
        !isValidId(cartItem.id) ||
        !isValidQuantity(cartItem.quantity)
      ) {
        continue;
      }

      id = cartItem.id.trim();
      quantity = cartItem.quantity;
    }

    // Legacy format: "product-id"
    else if (typeof item === "string") {
      if (!isValidId(item)) continue;

      id = item.trim();
      quantity = 1;
    } else {
      continue;
    }

    const existing = quantities.get(id) || 0;

    quantities.set(
      id,
      Math.min(existing + quantity, Number.MAX_SAFE_INTEGER)
    );
  }

  return Array.from(
    quantities,
    ([id, quantity]) => ({
      id,
      quantity,
    })
  );
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return normalizeCart(parsed);
  } catch (error) {
    console.error("Unable to read cart:", error);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (!isBrowser()) return;

  try {
    const normalized = normalizeCart(cart);

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(normalized)
    );

    window.dispatchEvent(
      new Event(CART_UPDATED_EVENT)
    );

    return true;
  } catch (error) {
    console.error("Unable to save cart:", error);
    return false;
  }
}

export function addToCart(
  product: CartProduct,
  quantity = 1
): CartItem[] {
  const cart = getCart();

  if (
    !isValidId(product.id) ||
    !isValidQuantity(quantity) ||
    !Number.isSafeInteger(product.stock_quantity) ||
    product.stock_quantity <= 0
  ) {
    return cart;
  }

  const productId = product.id.trim();

  const existing = cart.find(
    (item) => item.id === productId
  );

  let updatedCart: CartItem[];

  if (existing) {
    updatedCart = cart.map((item) =>
      item.id === productId
        ? {
            ...item,
            quantity: Math.min(
              item.quantity + quantity,
              product.stock_quantity
            ),
          }
        : item
    );
  } else {
    updatedCart = [
      ...cart,
      {
        id: productId,
        quantity: Math.min(
          quantity,
          product.stock_quantity
        ),
      },
    ];
  }

  saveCart(updatedCart);

  return updatedCart;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
  stockQuantity: number
): CartItem[] {
  if (!isValidId(productId)) {
    return getCart();
  }

  if (
    !Number.isSafeInteger(stockQuantity) ||
    stockQuantity < 0
  ) {
    return getCart();
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    stockQuantity === 0
  ) {
    return removeFromCart(productId);
  }

  const cart = getCart();

  const updatedCart = cart.map((item) =>
    item.id === productId
      ? {
          ...item,
          quantity: Math.min(
            quantity,
            stockQuantity
          ),
        }
      : item
  );

  saveCart(updatedCart);

  return updatedCart;
}

export function removeFromCart(
  productId: string
): CartItem[] {
  const updatedCart = getCart().filter(
    (item) => item.id !== productId
  );

  saveCart(updatedCart);

  return updatedCart;
}

export function clearCart(): CartItem[] {
  saveCart([]);

  return [];
}

export function getCartCount(
  cart: CartItem[] = getCart()
): number {
  return cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function subscribeToCart(
  callback: () => void
) {
  if (!isBrowser()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === CART_STORAGE_KEY ||
      event.key === null
    ) {
      callback();
    }
  };

  window.addEventListener(
    CART_UPDATED_EVENT,
    callback
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      CART_UPDATED_EVENT,
      callback
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}