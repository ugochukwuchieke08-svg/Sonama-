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

export function getCart(): CartItem[] {
if (!isBrowser()) return [];

try {
const stored = localStorage.getItem(CART_STORAGE_KEY);

if (!stored) return [];

const parsed = JSON.parse(stored);

if (!Array.isArray(parsed)) return [];

// Current cart format: [{ id, quantity }]
if (
  parsed.every(
    (item) =>
      item &&
      typeof item.id === "string" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  )
) {
  return parsed;
}

// Support older cart format: ["product-id", "product-id"]
if (parsed.every((item) => typeof item === "string")) {
  const quantities = new Map<string, number>();

  parsed.forEach((id) => {
    quantities.set(id, (quantities.get(id) || 0) + 1);
  });

  return Array.from(quantities, ([id, quantity]) => ({
    id,
    quantity,
  }));
}

return [];

} catch {
return [];
}
}

export function saveCart(cart: CartItem[]) {
if (!isBrowser()) return;

localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addToCart(
product: CartProduct,
quantity = 1
): CartItem[] {
const cart = getCart();

if (product.stock_quantity <= 0 || quantity <= 0) {
return cart;
}

const existing = cart.find((item) => item.id === product.id);

let updatedCart: CartItem[];

if (existing) {
updatedCart = cart.map((item) =>
item.id === product.id
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
id: product.id,
quantity: Math.min(quantity, product.stock_quantity),
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
const cart = getCart();

if (quantity <= 0) {
return removeFromCart(productId);
}

const updatedCart = cart.map((item) =>
item.id === productId
? {
...item,
quantity: Math.min(quantity, stockQuantity),
}
: item
);

saveCart(updatedCart);

return updatedCart;
}

export function removeFromCart(productId: string): CartItem[] {
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

export function getCartCount(cart: CartItem[] = getCart()): number {
return cart.reduce((total, item) => total + item.quantity, 0);
}

export function subscribeToCart(callback: () => void) {
if (!isBrowser()) return () => {};

window.addEventListener(CART_UPDATED_EVENT, callback);
window.addEventListener("storage", callback);

return () => {
window.removeEventListener(CART_UPDATED_EVENT, callback);
window.removeEventListener("storage", callback);
};
}