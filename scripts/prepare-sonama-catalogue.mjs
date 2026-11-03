import fs from "node:fs";

const INPUT_FILE = "scripts/fouani-catalogue.json";
const OUTPUT_FILE = "scripts/sonama-priced-catalogue.json";

const data = JSON.parse(
  fs.readFileSync(INPUT_FILE, "utf8")
);

const products = data.products.map((product) => {
  const supplierPrice = Number(product.supplier_price);

  if (!Number.isFinite(supplierPrice) || supplierPrice <= 0) {
    throw new Error(`Invalid supplier price: ${product.name}`);
  }

  const retailPrice = supplierPrice * 1.25;

  return {
    ...product,

    supplier_price: supplierPrice,
    price: retailPrice,

    stock_status: product.availability.includes("InStock")
      ? "In Stock"
      : "Out of Stock",

    is_active: product.availability.includes("InStock"),
    is_featured: false,
  };
});

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(products, null, 2)
);

console.log("\n========== SONAMA WILLS CATALOGUE ==========");
console.log("Total products:", products.length);
console.log(
  "In stock:",
  products.filter(p => p.is_active).length
);
console.log(
  "Out of stock:",
  products.filter(p => !p.is_active).length
);
console.log("\nSample prices:");

console.table(
  products.slice(0, 10).map(p => ({
    name: p.name,
    brand: p.brand,
    supplier_price: p.supplier_price,
    selling_price: p.price,
    stock: p.stock_status,
  }))
);

console.log("\nSaved to:", OUTPUT_FILE);