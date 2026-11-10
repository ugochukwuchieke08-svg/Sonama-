export const CART_STORAGE_KEY = "sonama-wills-cart";
export const CART_UPDATED_EVENT = "sonama-cart-updated";

export type CartSelections = {
  installationSelected?: boolean;
  kitSelected?: boolean;
  insuranceSelected?: boolean;
};

export type CartItem = {
  id: string;
  quantity: number;
  installationSelected: boolean;
  kitSelected: boolean;
  insuranceSelected: boolean;
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

function normalizeSelections(
  selections?: CartSelections
) {
  return {
    installationSelected:
      selections?.installationSelected === true,

    kitSelected:
      selections?.kitSelected === true,

    insuranceSelected:
      selections?.insuranceSelected === true,
  };
}

/**
 * Creates a unique identifier for each product configuration.
 * The same product with different extras gets a different key.
 */
export function getCartItemKey(item: CartItem): string {
  return JSON.stringify([
    item.id,
    item.installationSelected,
    item.kitSelected,
    item.insuranceSelected,
  ]);
}

function normalizeCart(items: unknown[]): CartItem[] {
  const quantities = new Map<string, CartItem>();

  for (const item of items) {
    let id: string;
    let quantity: number;
    let selections: CartSelections = {};

    // Current and previous object formats.
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "quantity" in item
    ) {
      const cartItem = item as {
        id: unknown;
        quantity: unknown;
        installationSelected?: unknown;
        kitSelected?: unknown;
        insuranceSelected?: unknown;
      };

      if (
        !isValidId(cartItem.id) ||
        !isValidQuantity(cartItem.quantity)
      ) {
        continue;
      }

      id = cartItem.id.trim();
      quantity = cartItem.quantity;

      selections = {
        installationSelected:
          cartItem.installationSelected === true,

        kitSelected:
          cartItem.kitSelected === true,

        insuranceSelected:
          cartItem.insuranceSelected === true,
      };
    }

    // Legacy format: "product-id"
    else if (typeof item === "string") {
      if (!isValidId(item)) continue;

      id = item.trim();
      quantity = 1;
    } else {
      continue;
    }

    const normalizedItem: CartItem = {
      id,
      quantity,
      ...normalizeSelections(selections),
    };

    const key = getCartItemKey(normalizedItem);
    const existing = quantities.get(key);

    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + quantity,
        Number.MAX_SAFE_INTEGER
      );
    } else {
      quantities.set(key, normalizedItem);
    }
  }

  return Array.from(quantities.values());
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
  if (!isBrowser()) return false;

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
  quantity = 1,
  selections: CartSelections = {}
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

  const normalizedSelections =
    normalizeSelections(selections);

  const newItem: CartItem = {
    id: productId,
    quantity,
    ...normalizedSelections,
  };

  const newKey = getCartItemKey(newItem);

  const existing = cart.find(
    (item) => getCartItemKey(item) === newKey
  );

  // Stock is shared across all configurations of the same product.
  const totalProductQuantity = cart
    .filter((item) => item.id === productId)
    .reduce((total, item) => total + item.quantity, 0);

  const remainingStock = Math.max(
    0,
    product.stock_quantity - totalProductQuantity
  );

  const quantityToAdd = Math.min(
    quantity,
    remainingStock
  );

  if (quantityToAdd <= 0) return cart;

  let updatedCart: CartItem[];

  if (existing) {
    updatedCart = cart.map((item) =>
      getCartItemKey(item) === newKey
        ? {
            ...item,
            quantity: item.quantity + quantityToAdd,
          }
        : item
    );
  } else {
    updatedCart = [
      ...cart,
      {
        ...newItem,
        quantity: quantityToAdd,
      },
    ];
  }

  saveCart(updatedCart);

  return updatedCart;
}

export function updateCartQuantity(
  itemKey: string,
  quantity: number,
  stockQuantity: number
): CartItem[] {
  if (!isValidId(itemKey)) {
    return getCart();
  }

  if (
    !Number.isSafeInteger(stockQuantity) ||
    stockQuantity < 0
  ) {
    return getCart();
  }

  const cart = getCart();

  // Prefer an exact configuration match.
  let target = cart.find(
    (item) => getCartItemKey(item) === itemKey
  );

  // Backward compatibility for callers passing a product ID.
  if (!target) {
    const matchingItems = cart.filter(
      (item) => item.id === itemKey
    );

    if (matchingItems.length === 1) {
      target = matchingItems[0];
    }
  }

  if (!target) return cart;

  const targetKey = getCartItemKey(target);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    stockQuantity === 0
  ) {
    return removeFromCart(targetKey);
  }

  const otherConfigurationsQuantity = cart
    .filter(
      (item) =>
        item.id === target.id &&
        getCartItemKey(item) !== targetKey
    )
    .reduce((total, item) => total + item.quantity, 0);

  const availableForThisConfiguration = Math.max(
    0,
    stockQuantity - otherConfigurationsQuantity
  );

  if (availableForThisConfiguration === 0) {
    return removeFromCart(targetKey);
  }

  const updatedCart = cart.map((item) =>
    getCartItemKey(item) === targetKey
      ? {
          ...item,
          quantity: Math.min(
            quantity,
            availableForThisConfiguration
          ),
        }
      : item
  );

  saveCart(updatedCart);

  return updatedCart;
}

export function removeFromCart(
  itemKey: string
): CartItem[] {
  const cart = getCart();

  // Remove an exact configuration when its key is provided.
  const exactMatch = cart.some(
    (item) => getCartItemKey(item) === itemKey
  );

  const updatedCart = exactMatch
    ? cart.filter(
        (item) => getCartItemKey(item) !== itemKey
      )
    : cart.filter(
        (item) => item.id !== itemKey
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