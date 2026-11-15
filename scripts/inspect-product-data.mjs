import fs from "node:fs";

const html = fs.readFileSync("scripts/fouani-product-273.html", "utf8");

const match = html.match(
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
);

if (!match) throw new Error("NEXT_DATA not found");

const data = JSON.parse(match[1]);
const props = data.props?.pageProps;

console.log("PAGE PROPS KEYS:", Object.keys(props || {}));

for (const [key, value] of Object.entries(props || {})) {
  if (value && typeof value === "object") {
    console.log(`\n${key}:`);
    console.log(JSON.stringify(value, null, 2).slice(0, 12000));
  }
}
