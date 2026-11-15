const url = "https://fouanistore.com/nigeria-en/shop?page=2";

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
    Accept: "text/html"
  }
});

console.log("HTTP:", response.status);

const html = await response.text();

const match = html.match(
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
);

if (!match) {
  console.log("NEXT_DATA not found");
  console.log(html.slice(0, 2000));
  process.exit(1);
}

const data = JSON.parse(match[1]);
const catalogue = data.props?.pageProps?.data;

console.log("CURRENT PAGE:", catalogue?.current_page);
console.log("TOTAL:", catalogue?.total);
console.log("LAST PAGE:", catalogue?.last_page);
console.log("PRODUCTS:", catalogue?.data?.length);
console.log("FIRST PRODUCT:", catalogue?.data?.[0]?.name);
