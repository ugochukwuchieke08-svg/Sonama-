import fs from "node:fs";

const full = JSON.parse(
  fs.readFileSync("scripts/fouani-full-catalogue.json", "utf8")
).products;

const existing = JSON.parse(
  fs.readFileSync("scripts/sonama-import-ready.json", "utf8")
);

console.log("\n========== DUPLICATE SKU ==========");

const duplicates = full.filter(
  p => String(p.sku).trim().toLowerCase() === "lgtv97g66lw"
);

for (const p of duplicates) {
  console.log({
    id: p.id,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    price: p.supplier_price,
    images: p.image_count,
    url: p.source_url
  });
}

console.log("\n========== MISSING DESCRIPTION ==========");

for (const p of full.filter(p => !p.description?.trim())) {
  console.log({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.supplier_price,
    images: p.image_count,
    url: p.source_url
  });
}

const existingSkus = new Set(
  existing.map(p => String(p.sku ?? "").trim().toLowerCase()).filter(Boolean)
);

const existingNames = new Set(
  existing.map(p => String(p.name ?? "").trim().toLowerCase()).filter(Boolean)
);

const overlaps = full.filter(p =>
  existingSkus.has(String(p.sku ?? "").trim().toLowerCase()) ||
  existingNames.has(String(p.name ?? "").trim().toLowerCase())
);

console.log("\n========== EXISTING PRODUCT OVERLAP ==========");
console.log("Existing products:", existing.length);
console.log("Matching products in full catalogue:", overlaps.length);

for (const p of overlaps) {
  console.log(`${p.id} | ${p.name} | ${p.sku}`);
}
