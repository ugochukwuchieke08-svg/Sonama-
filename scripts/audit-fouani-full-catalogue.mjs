import fs from "node:fs";

const file = "scripts/fouani-full-catalogue.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const products = data.products;

const count = (fn) => products.filter(fn).length;

const skuCounts = new Map();

for (const product of products) {
  const sku = String(product.sku ?? "").trim().toLowerCase();

  if (sku) {
    skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  }
}

const duplicateSkus = [...skuCounts.entries()]
  .filter(([, count]) => count > 1);

const imageCounts = products.map(p => p.image_count ?? 0);

const distribution = {
  "0 images": imageCounts.filter(n => n === 0).length,
  "1 image": imageCounts.filter(n => n === 1).length,
  "2-5 images": imageCounts.filter(n => n >= 2 && n <= 5).length,
  "6-10 images": imageCounts.filter(n => n >= 6 && n <= 10).length,
  "More than 10": imageCounts.filter(n => n > 10).length,
};

console.log("\n========== CATALOGUE QUALITY AUDIT ==========");
console.log("Total products:", products.length);
console.log("Missing names:", count(p => !p.name?.trim()));
console.log("Missing brands:", count(p => !p.brand?.trim()));
console.log("Missing SKUs:", count(p => !p.sku?.trim()));
console.log("Missing descriptions:", count(p => !p.description?.trim()));
console.log("Missing supplier prices:", count(p => !Number.isFinite(p.supplier_price) || p.supplier_price <= 0));
console.log("Missing primary images:", count(p => !p.image_url));
console.log("Products without galleries:", count(p => !p.images?.length));
console.log("Duplicate SKUs:", duplicateSkus.length);

console.log("\nIMAGE DISTRIBUTION:");

for (const [label, value] of Object.entries(distribution)) {
  console.log(`${label}: ${value}`);
}

console.log("\nTOTAL IMAGES:", imageCounts.reduce((a, b) => a + b, 0));

console.log("\nDUPLICATE SKU EXAMPLES:");

for (const [sku, count] of duplicateSkus.slice(0, 15)) {
  console.log(`${sku}: ${count} products`);
}

console.log("\nPRODUCTS MISSING PRICES:");

for (const p of products.filter(p => !Number.isFinite(p.supplier_price) || p.supplier_price <= 0).slice(0, 15)) {
  console.log(`${p.id} | ${p.name} | ${p.supplier_price}`);
}
