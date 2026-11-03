import fs from "node:fs";

const data = JSON.parse(
  fs.readFileSync("scripts/fouani-catalogue.json", "utf8")
);

const products = data.products;

const brands = {};

for (const product of products) {
  const brand = product.brand || "Unknown";

  brands[brand] = (brands[brand] || 0) + 1;
}

const inStock = products.filter(p =>
  p.availability.includes("InStock")
);

const outOfStock = products.filter(p =>
  p.availability.includes("OutOfStock")
);

const missing = products.filter(p =>
  !p.name ||
  !p.brand ||
  !p.description ||
  !p.image_url ||
  !p.supplier_price
);

console.log("\n========== BRAND DISTRIBUTION ==========");

console.table(
  Object.entries(brands).map(([brand, count]) => ({
    brand,
    products: count,
  }))
);

console.log("\n========== STOCK STATUS ==========");
console.log("In stock:", inStock.length);
console.log("Out of stock:", outOfStock.length);

console.log("\n========== INCOMPLETE PRODUCTS ==========");
console.log("Count:", missing.length);

console.table(
  missing.map(p => ({
    name: p.name,
    brand: p.brand,
    sku: p.sku,
  }))
);

console.log("\n========== FAILED EXTRACTIONS ==========");
console.table(data.failed);

console.log("\nTotal extracted:", products.length);