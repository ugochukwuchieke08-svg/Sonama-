import fs from "node:fs";

const html = fs.readFileSync("scripts/fouani-shop.html", "utf8");
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

if (!match) throw new Error("NEXT_DATA not found");

const data = JSON.parse(match[1]);
const catalogue = data.props.pageProps.data;

console.log("CATALOGUE METADATA:");
console.log(JSON.stringify({
  tenant: catalogue.tenant,
  selected_branch_id: catalogue.selected_branch_id,
  current_page: catalogue.current_page,
  per_page: catalogue.per_page,
  total: catalogue.total,
  last_page: catalogue.last_page,
  path: catalogue.path,
  first_page_url: catalogue.first_page_url,
  next_page_url: catalogue.next_page_url
}, null, 2));

console.log("\nNEXT.JS BUILD ID:", data.buildId);
console.log("PAGE:", data.page);
