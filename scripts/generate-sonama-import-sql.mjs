import fs from "node:fs";

const inputPath = "scripts/sonama-import-ready.json";
const outputPath = "scripts/import-sonama-products.sql";

const products = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

if (!Array.isArray(products) || products.length !== 49) {
  throw new Error("Expected exactly 49 products.");
}

function sql(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Invalid numeric value.");
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
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
  "is_active",
  "is_featured",
  "brand",
];

const values = products.map((product) => {
  return `(${columns.map((column) => {
    if (!(column in product)) {
      throw new Error(
        `Missing ${column} in product: ${product.name}`
      );
    }

    return sql(product[column]);
  }).join(", ")})`;
});

const output = `
BEGIN;

INSERT INTO public.products (
  ${columns.join(", ")}
)
VALUES
${values.join(",\n")};

COMMIT;
`;

fs.writeFileSync(outputPath, output.trim() + "\n");

console.log(`Generated ${outputPath}`);
console.log(`Products prepared: ${products.length}`);