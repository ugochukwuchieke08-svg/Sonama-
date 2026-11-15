import fs from "node:fs";
import path from "node:path";

const dir = "scripts";

const catalogue = JSON.parse(
  fs.readFileSync(path.join(dir, "fouani-full-catalogue.json"), "utf8")
);

const comparison = JSON.parse(
  fs.readFileSync(path.join(dir, "fouani-live-comparison.json"), "utf8")
);

const existing = JSON.parse(
  fs.readFileSync(path.join(dir, "existing-products.json"), "utf8")
);

const allowedCategories = [
  "Televisions",
  "Air Conditioners",
  "Audio",
  "Kitchen/Home Appliances",
  "Solar & Power Solutions",
  "Washing Machines",
  "Refrigerators",
  "Freezers",
  "Office Furniture",
  "Computers & Accessories",
];

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

function classify(product) {
  const name = normalize(product.name);
  const description = normalize(product.description);
  const text = `${name} ${description}`;

  if (/\b(television|tv|oled|qled|uhd|smart tv|projector|interactive display)\b/.test(text)) {
    return "Televisions";
  }

  if (/\b(air conditioner|air conditioning|split ac|portable ac)\b/.test(text)) {
    return "Air Conditioners";
  }

  if (/\b(soundbar|speaker|subwoofer|headphone|earphone|home theatre|home theater|mini hi-fi|hi-fi system|audio)\b/.test(text)) {
    return "Audio";
  }

  if (/\b(washing machine|washer|washer-dryer|wash and dry|dryer|clothes dryer|lg styler|styler|garment care|clothing care|steam closet)\b/.test(text)) {
    return "Washing Machines";
  }

  if (/\b(deep freezer|chest freezer|upright freezer|freezer)\b/.test(text)) {
    return "Freezers";
  }

  if (/\b(refrigerator|fridge|refrigeration|beverage cooler)\b/.test(text)) {
    return "Refrigerators";
  }

  if (/\b(solar|inverter|battery|power station|generator|kva|kw generator|bess|pv controller|pcs module|mounting rail|rail joiner|rail splice)\b/.test(text)) {
    return "Solar & Power Solutions";
  }

  if (/\b(desk|office chair|office table|credenza|cabinet|office furniture)\b/.test(text)) {
    return "Office Furniture";
  }

  if (/\b(laptop|notebook pc|desktop computer|monitor|computer accessories)\b/.test(text)) {
    return "Computers & Accessories";
  }

  if (
    /\b(toaster|kettle|microwave|cooker|gas cooker|oven|blender|mixer|coffee machine|coffee maker|espresso|kitchen scale|food processor|dishwasher|air fryer|hob|air cooler|fan|water heater|juicer|grill|water dispenser|steam iron|iron|vacuum cleaner|ice maker|hood|knife block|knife set)\b/.test(text)
  ) {
    return "Kitchen/Home Appliances";
  }

  return null;
}

const newSkus = new Set(
  comparison.products
    .filter((product) => product.status === "new")
    .map((product) => normalize(product.sku))
    .filter(Boolean)
);

const existingSkus = new Set(
  existing.map((product) => normalize(product.sku)).filter(Boolean)
);

const existingSlugs = new Set(
  existing.map((product) => normalize(product.slug)).filter(Boolean)
);

// Group source products by normalized SKU.
// Keep the listing with the largest image gallery.
const grouped = new Map();

for (const product of catalogue.products) {
  const sku = normalize(product.sku);

  if (!sku || !newSkus.has(sku)) continue;

  // Previously identified duplicate Fouani listing.
  if (Number(product.id) === 1141) continue;

  const current = grouped.get(sku);

  if (
    !current ||
    (product.images?.length ?? 0) > (current.images?.length ?? 0)
  ) {
    grouped.set(sku, product);
  }
}

const usedSlugs = new Set(existingSlugs);
const usedSkus = new Set(existingSkus);

const ready = [];
const needsReview = [];
const skipped = [];

for (const product of grouped.values()) {
  const sku = String(product.sku ?? "").trim();

  if (!sku || usedSkus.has(normalize(sku))) {
    skipped.push({
      id: product.id,
      name: product.name,
      sku,
      reason: "SKU already exists or is missing",
    });
    continue;
  }

  const category = classify(product);

  if (!category || !allowedCategories.includes(category)) {
    needsReview.push({
      fouani_id: product.id,
      name: product.name,
      sku,
      brand: product.brand,
      supplier_price: product.supplier_price,
      suggested_category: category,
      reason: "Category needs manual review",
    });
    continue;
  }

  let slug = slugify(product.name);

  if (!slug) {
    slug = `product-${product.id}`;
  }

  const originalSlug = slug;
  let suffix = 1;

  while (usedSlugs.has(slug)) {
    slug = `${originalSlug}-${product.id}-${suffix}`;
    suffix++;
  }

  const imageUrls = [
    ...new Set(
      (product.images ?? [])
        .map((image) => image?.url)
        .filter((url) => typeof url === "string" && url.startsWith("https://"))
    ),
  ];

  const primaryImage =
    product.image_url ||
    imageUrls[0] ||
    null;

  const gallery = imageUrls.filter((url) => url !== primaryImage);

  if (primaryImage && !imageUrls.includes(primaryImage)) {
    imageUrls.unshift(primaryImage);
  }

  const supplierPrice = Number(product.supplier_price);

  if (!Number.isFinite(supplierPrice) || supplierPrice < 0 || !primaryImage) {
    skipped.push({
      id: product.id,
      name: product.name,
      sku,
      reason: "Invalid supplier price or missing primary image",
    });
    continue;
  }

  ready.push({
    name: product.name,
    slug,
    description: product.description || "",
    category,
    sku,
    price: Math.round(supplierPrice * 1.20),
    stock_quantity: Math.max(0, Number(product.stock_quantity) || 0),
    image_url: primaryImage,
    image_urls: gallery,
    is_active: true,
    is_featured: false,
    brand: product.brand || null,

    // Audit information. These fields are NOT intended for the products table.
    supplier_price: supplierPrice,
    fouani_id: product.id,
    source_url: product.source_url || null,
  });

  usedSkus.add(normalize(sku));
  usedSlugs.add(slug);
}

const counts = {};

for (const category of allowedCategories) {
  counts[category] = ready.filter(
    (product) => product.category === category
  ).length;
}

const output = {
  generated_at: new Date().toISOString(),
  markup: 0.20,
  total_ready: ready.length,
  total_needing_review: needsReview.length,
  total_skipped: skipped.length,
  category_counts: counts,
  products: ready,
  needs_review: needsReview,
  skipped,
};

fs.writeFileSync(
  path.join(dir, "fouani-import-ready.json"),
  JSON.stringify(output, null, 2)
);

console.log("\n========== PREPARATION COMPLETE ==========\n");
console.log("Comparison candidates:", newSkus.size);
console.log("Products ready:", ready.length);
console.log("Needs manual review:", needsReview.length);
console.log("Skipped:", skipped.length);

console.log("\nCATEGORY BREAKDOWN:");

for (const [category, count] of Object.entries(counts)) {
  console.log(`${category}: ${count}`);
}

console.log("\nSaved: scripts/fouani-import-ready.json");
console.log("No database changes were made.");