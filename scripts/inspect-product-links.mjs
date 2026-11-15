const response = await fetch("https://fouanistore.com/nigeria-en/shop", {
  headers: { "User-Agent": "Mozilla/5.0" }
});

const html = await response.text();
const match = html.match(
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
);

const data = JSON.parse(match[1]);
const product = data.props.pageProps.data.data[0];

console.log("PRODUCT KEYS:");
console.log(Object.keys(product));

console.log("\nPRODUCT ID:", product.id);
console.log("PRODUCT NAME:", product.name);
console.log("\nPRODUCT URL FIELDS:");

for (const [key, value] of Object.entries(product)) {
  if (/slug|url|link|route|id/i.test(key)) {
    console.log(key, JSON.stringify(value));
  }
}
