import fs from "node:fs";

const html = fs.readFileSync(
  "scripts/fouani-product-839.html",
  "utf8"
);

function getMeta(property) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );

  return html.match(regex)?.[1] ?? "Not found";
}

console.log("PAGE TITLE:");
console.log(html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]);

console.log("\nPRODUCT METADATA:");

for (const property of [
  "og:title",
  "og:description",
  "og:image",
  "product:price:amount",
  "product:price:currency",
  "description"
]) {
  console.log(`${property}:`, getMeta(property));
}

console.log("\nJSON-LD PRODUCT DATA:");

const jsonBlocks = [
  ...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
];

for (const block of jsonBlocks) {
  try {
    console.log(JSON.stringify(JSON.parse(block[1]), null, 2));
  } catch {
    console.log("Could not parse JSON-LD block.");
  }
}