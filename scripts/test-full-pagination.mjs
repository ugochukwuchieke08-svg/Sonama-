const base = "https://fouanistore.com/nigeria-en/shop";

const allProducts = [];
let expectedTotal = null;
let lastPage = null;

for (let page = 1; page <= 17; page++) {
  const response = await fetch(`${base}?page=${page}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html"
    }
  });

  if (!response.ok) {
    throw new Error(`Page ${page} failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error(`NEXT_DATA missing on page ${page}`);
  }

  const data = JSON.parse(match[1]);
  const catalogue = data.props?.pageProps?.data;

  if (!catalogue?.data) {
    throw new Error(`Product data missing on page ${page}`);
  }

  expectedTotal = catalogue.total;
  lastPage = catalogue.last_page;

  allProducts.push(...catalogue.data);

  console.log(
    `Page ${page}/${lastPage}: ${catalogue.data.length} products`
  );

  await new Promise(resolve => setTimeout(resolve, 700));
}

const unique = new Map();

for (const product of allProducts) {
  unique.set(String(product.id), product);
}

console.log("\n--- CATALOGUE SUMMARY ---");
console.log("Reported total:", expectedTotal);
console.log("Pages:", lastPage);
console.log("Products fetched:", allProducts.length);
console.log("Unique product IDs:", unique.size);
console.log("Duplicates:", allProducts.length - unique.size);
console.log("First product:", allProducts[0]?.name);
console.log("Last product:", allProducts.at(-1)?.name);
