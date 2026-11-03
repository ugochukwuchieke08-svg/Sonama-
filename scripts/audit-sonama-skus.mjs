import fs from "node:fs";

const products = JSON.parse(
  fs.readFileSync("scripts/sonama-import-ready.json", "utf8")
);

const skuMap = new Map();

for (const product of products) {
  const sku = product.sku?.trim();

  if (!sku) continue;

  if (!skuMap.has(sku)) {
    skuMap.set(sku, []);
  }

  skuMap.get(sku).push(product.name);
}

const duplicates = [...skuMap.entries()]
  .filter(([, names]) => names.length > 1);

const missing = products.filter(p => !p.sku?.trim());

console.log("\n========== SKU AUDIT ==========");
console.log("Total products:", products.length);
console.log("Products with SKUs:", products.length - missing.length);
console.log("Missing SKUs:", missing.length);
console.log("Duplicate SKUs:", duplicates.length);

if (missing.length) {
  console.log("\nPRODUCTS WITHOUT SKUs:");
  console.table(missing.map(p => ({ name: p.name })));
}

if (duplicates.length) {
  console.log("\nDUPLICATE SKUs:");
  console.log(duplicates);
}

console.log("\nSKU audit completed.");