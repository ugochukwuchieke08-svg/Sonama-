import fs from "node:fs";

const products = JSON.parse(
  fs.readFileSync("scripts/sonama-import-ready.json", "utf8")
);

console.table(
  products.map((p, i) => ({
    number: i + 1,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    active: p.is_active,
  }))
);