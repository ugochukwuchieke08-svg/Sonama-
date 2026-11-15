import fs from "node:fs";

for (const id of [273, 839]) {
  const html = fs.readFileSync(`scripts/fouani-product-${id}.html`, "utf8");
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

  if (!match) {
    console.log(`Product ${id}: NEXT_DATA not found`);
    continue;
  }

  const product = JSON.parse(match[1]).props.pageProps.data.data;

  console.log(`\n${product.name}`);
  console.log("Product ID:", product.id);
  console.log("Gallery images:", product.images?.length ?? 0);

  for (const [index, image] of (product.images || []).entries()) {
    console.log(`${index + 1}. ${image.base_url}/${image.origin}`);
  }
}
