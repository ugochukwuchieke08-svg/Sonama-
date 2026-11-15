import fs from "node:fs";

const html = fs.readFileSync("scripts/fouani-shop.html", "utf8");

for (const term of [
  "selected_branch_id",
  "branch_id",
  "X-Tenant",
  "tenant",
  "api/user/product/v1/list"
]) {
  console.log(`\n========== ${term} ==========`);

  let position = -1;
  let count = 0;

  while ((position = html.indexOf(term, position + 1)) !== -1 && count < 5) {
    console.log(html.slice(Math.max(0, position - 250), position + 500));
    count++;
  }

  if (count === 0) console.log("Not found");
}
