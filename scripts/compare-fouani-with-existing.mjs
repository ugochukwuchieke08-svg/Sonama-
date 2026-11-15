import fs from "node:fs";
import path from "node:path";

const baseDir = process.cwd();

const cataloguePath = path.join(
  baseDir,
  "scripts/fouani-full-catalogue.json"
);

const existingPath = path.join(
  baseDir,
  "scripts/existing-products.json"
);

const outputPath = path.join(
  baseDir,
  "scripts/fouani-live-comparison.json"
);

const catalogue = JSON.parse(
  fs.readFileSync(cataloguePath, "utf8")
);

const existing = JSON.parse(
  fs.readFileSync(existingPath, "utf8")
);

function normalizeSku(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const existingSkuMap = new Map();
const existingNameMap = new Map();

for (const product of existing) {
  const sku = normalizeSku(product.sku);
  const name = normalizeName(product.name);

  if (sku) existingSkuMap.set(sku, product);
  if (name) existingNameMap.set(name, product);
}

// Group Fouani products by SKU.
const skuGroups = new Map();

for (const product of catalogue.products) {
  const sku = normalizeSku(product.sku);

  if (!sku) continue;

  if (!skuGroups.has(sku)) {
    skuGroups.set(sku, []);
  }

  skuGroups.get(sku).push(product);
}

const duplicateSkuGroups = [];
const duplicateSourceIds = new Set();

// Keep the listing with the largest gallery for duplicate SKUs.
for (const [sku, products] of skuGroups) {
  if (products.length <= 1) continue;

  const sorted = [...products].sort(
    (a, b) => (b.images?.length ?? 0) - (a.images?.length ?? 0)
  );

  const kept = sorted[0];
  const excluded = sorted.slice(1);

  for (const product of excluded) {
    duplicateSourceIds.add(product.id);
  }

  duplicateSkuGroups.push({
    sku,
    kept: {
      id: kept.id,
      name: kept.name,
      image_count: kept.images?.length ?? 0,
    },
    excluded: excluded.map(product => ({
      id: product.id,
      name: product.name,
      image_count: product.images?.length ?? 0,
    })),
  });
}

const results = [];

for (const product of catalogue.products) {
  if (duplicateSourceIds.has(product.id)) continue;

  const sku = normalizeSku(product.sku);
  const name = normalizeName(product.name);

  const skuMatch = sku ? existingSkuMap.get(sku) : null;
  const nameMatch = name ? existingNameMap.get(name) : null;

  let status = "new";

  if (skuMatch) {
    status = "already_exists_sku";
  } else if (nameMatch) {
    status = "possible_duplicate_name";
  }

  results.push({
    source_id: product.id,
    name: product.name,
    sku: product.sku,
    supplier_price: product.supplier_price,
    retail_price: Number(
      (Number(product.supplier_price) * 1.20).toFixed(2)
    ),
    brand: product.brand,
    image_url: product.image_url,
    image_count: product.images?.length ?? 0,
    status,
    matched_existing_product: skuMatch
      ? {
          name: skuMatch.name,
          sku: skuMatch.sku,
          slug: skuMatch.slug,
          price: skuMatch.price,
          match_type: "sku",
        }
      : nameMatch
        ? {
            name: nameMatch.name,
            sku: nameMatch.sku,
            slug: nameMatch.slug,
            price: nameMatch.price,
            match_type: "name",
          }
        : null,
  });
}

const report = {
  generated_at: new Date().toISOString(),
  total_fouani_products: catalogue.products.length,
  total_existing_products: existing.length,
  duplicate_fouani_sku_groups: duplicateSkuGroups,
  summary: {
    new_products: results.filter(p => p.status === "new").length,
    existing_sku_matches: results.filter(
      p => p.status === "already_exists_sku"
    ).length,
    possible_name_matches: results.filter(
      p => p.status === "possible_duplicate_name"
    ).length,
    excluded_duplicate_source_listings: duplicateSourceIds.size,
  },
  products: results,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("\n========== COMPARISON COMPLETE ==========\n");

console.log("Fouani products:", report.total_fouani_products);
console.log("Existing database products:", report.total_existing_products);

console.log("\nRESULTS:");
console.log("New products:", report.summary.new_products);
console.log("Existing SKU matches:", report.summary.existing_sku_matches);
console.log("Possible name matches:", report.summary.possible_name_matches);
console.log(
  "Duplicate Fouani listings excluded:",
  report.summary.excluded_duplicate_source_listings
);

console.log("\nDuplicate SKU groups:");

for (const group of duplicateSkuGroups) {
  console.log(`\nSKU: ${group.sku}`);
  console.log("Kept:", group.kept);
  console.log("Excluded:", group.excluded);
}

console.log("\nReport saved to:", outputPath);