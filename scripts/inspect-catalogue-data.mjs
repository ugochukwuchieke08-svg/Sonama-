import fs from "node:fs";

const html = fs.readFileSync("scripts/fouani-shop.html", "utf8");
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

if (!match) throw new Error("NEXT_DATA not found");

const data = JSON.parse(match[1]);
const catalogue = data.props.pageProps.data;

console.log("CATALOGUE DATA KEYS:");
console.log(Object.keys(catalogue));

console.log("\nPAGINATION LINKS:");
console.log(JSON.stringify(catalogue.links, null, 2));

console.log("\nFIRST PRODUCT:");
console.log(JSON.stringify(catalogue.data[0], null, 2));

console.log("\nLAST PRODUCT:");
console.log(JSON.stringify(catalogue.data.at(-1), null, 2));
