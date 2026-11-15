import fs from "node:fs";

const html = fs.readFileSync("scripts/fouani-product-273.html", "utf8");
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

if (!match) throw new Error("NEXT_DATA not found");

const data = JSON.parse(match[1]);
const product = data.props.pageProps.data.data;

console.log("IMAGES:");
console.log(JSON.stringify(product.images, null, 2));

console.log("\nFILES:");
console.log(JSON.stringify(product.files, null, 2));

console.log("\nBRAND:");
console.log(JSON.stringify(product.brand, null, 2));

console.log("\nCATEGORIES:");
console.log(JSON.stringify(product.product_categories, null, 2));
