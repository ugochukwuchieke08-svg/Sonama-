import fs from "node:fs";

const INPUT = "scripts/sonama-priced-catalogue.json";
const OUTPUT = "scripts/sonama-import-ready.json";
const BRANDS_OUTPUT = "scripts/sonama-brands-ready.json";

const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));

function getCategory(product) {
  const name = product.name.toLowerCase();

  // Air conditioners must come before inverter matching
  if (/air conditioner|split ac|portable ac/.test(name)) {
    return "Air Conditioners";
  }

  // Solar and power
  if (/inverter|battery|ups|generator/.test(name)) {
    return "Solar & Power Solutions";
  }

  if (/television|\btv\b|tv stand/.test(name)) {
    return "Televisions";
  }

  if (/soundbar|speaker|dvd player/.test(name)) {
    return "Audio";
  }

  if (/monitor/.test(name)) {
    return "Computers & Accessories";
  }

  if (/washing machine/.test(name)) {
    return "Washing Machines";
  }

  if (/refrigerator|\bfridge\b/.test(name)) {
    return "Refrigerators";
  }

  if (/chest freezer|\bfreezer\b/.test(name)) {
    return "Freezers";
  }

  if (/meeting table/.test(name)) {
    return "Office Furniture";
  }

  return "Kitchen/Home Appliances";
}

function makeSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const products = data.map((product) => {
  const inStock = product.availability.includes("InStock");

  return {
    name: product.name,
    slug: makeSlug(product.name),
    description: product.description,
    category: getCategory(product),
    sku: product.sku || null,
    price: product.price,
    stock_quantity: inStock ? 1 : 0,
    image_url: product.image_url,
    is_active: inStock,
    is_featured: false,
    brand: product.brand,
  };
});

const slugs = products.map(p => p.slug);
const duplicateSlugs = slugs.filter(
  (slug, index) => slugs.indexOf(slug) !== index
);

const brands = {};

for (const product of products) {
  if (!brands[product.brand]) {
    brands[product.brand] = new Set();
  }

  brands[product.brand].add(product.category);
}

const brandRecords = Object.entries(brands).map(([name, categories]) => ({
  name,
  categories: [...categories],
}));

fs.writeFileSync(OUTPUT, JSON.stringify(products, null, 2));
fs.writeFileSync(
  BRANDS_OUTPUT,
  JSON.stringify(brandRecords, null, 2)
);

console.log("\n========== IMPORT PREPARATION ==========");
console.log("Products:", products.length);
console.log("Active:", products.filter(p => p.is_active).length);
console.log("Inactive:", products.filter(p => !p.is_active).length);
console.log("Duplicate slugs:", duplicateSlugs.length);

console.log("\nCATEGORY DISTRIBUTION:");

console.table(
  Object.entries(
    products.reduce((result, p) => {
      result[p.category] = (result[p.category] || 0) + 1;
      return result;
    }, {})
  ).map(([category, count]) => ({ category, count }))
);

console.log("\nBRANDS:");
console.table(brandRecords.map(b => ({
  brand: b.name,
  categories: b.categories.join(", "),
})));

if (duplicateSlugs.length) {
  console.log("\nDUPLICATE SLUGS:");
  console.log(duplicateSlugs);
}

console.log("\nSaved:");
console.log(OUTPUT);
console.log(BRANDS_OUTPUT);