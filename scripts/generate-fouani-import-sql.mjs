import fs from "node:fs";
import path from "node:path";

const inputPath = path.resolve("scripts/fouani-import-ready.json");
const outputPath = path.resolve("scripts/fouani-import.sql");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const products = data.products;

if (!Array.isArray(products) || products.length !== 633) {
  throw new Error(`Expected 633 products, found ${products?.length ?? 0}`);
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return number;
}

function sqlBoolean(value) {
  return value ? "TRUE" : "FALSE";
}

function sqlTextArray(values) {
  if (!Array.isArray(values)) return "ARRAY[]::text[]";

  const entries = values.map((value) => sqlString(value));

  return `ARRAY[${entries.join(", ")}]::text[]`;
}

const columns = [
  "name",
  "slug",
  "description",
  "category",
  "sku",
  "price",
  "stock_quantity",
  "image_url",
  "image_urls",
  "is_active",
  "is_featured",
  "brand",
];

const values = products.map((product, index) => {
  if (!product.name || !product.slug || !product.category || !product.sku) {
    throw new Error(`Missing required field in product ${index + 1}`);
  }

  if (!product.image_url || !product.image_url.startsWith("https://")) {
    throw new Error(`Invalid primary image for ${product.name}`);
  }

  const gallery = Array.isArray(product.image_urls)
    ? product.image_urls
    : [];

  if (gallery.some((url) => typeof url !== "string" || !url.startsWith("https://"))) {
    throw new Error(`Invalid gallery image for ${product.name}`);
  }

  if (gallery.includes(product.image_url)) {
    throw new Error(`Primary image duplicated in gallery: ${product.name}`);
  }

  return `(
    ${sqlString(product.name)},
    ${sqlString(product.slug)},
    ${sqlString(product.description || "")},
    ${sqlString(product.category)},
    ${sqlString(product.sku)},
    ${sqlNumber(product.price)},
    ${sqlNumber(product.stock_quantity)},
    ${sqlString(product.image_url)},
    ${sqlTextArray(gallery)},
    ${sqlBoolean(product.is_active)},
    ${sqlBoolean(product.is_featured)},
    ${sqlString(product.brand)}
  )`;
});

const sql = `-- SONAMA WILLS: Fouani catalogue import
-- Generated products: ${products.length}
-- Existing products are never updated.
-- Audit-only fields are intentionally excluded.

BEGIN;

INSERT INTO public.products (
  ${columns.join(",\n  ")}
)
VALUES
${values.join(",\n")}
ON CONFLICT DO NOTHING;

COMMIT;
`;

fs.writeFileSync(outputPath, sql, "utf8");

console.log("========== SQL GENERATION COMPLETE ==========");
console.log(`Products prepared: ${products.length}`);
console.log(`SQL file: ${outputPath}`);
console.log("Database changes: NONE");