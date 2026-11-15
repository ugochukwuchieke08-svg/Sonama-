const url = "https://api.fouanistore.com/api/user/product/v1/list?page=2&selected_branch_id=1";

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
    Referer: "https://fouanistore.com/nigeria-en/shop",
    Origin: "https://fouanistore.com"
  }
});

const result = await response.json();

console.log("HTTP:", response.status);
console.log("SUCCESS:", result.success);
console.log("BRANCH:", result.selected_branch_id);
console.log("TOTAL:", result.total);
console.log("PER PAGE:", result.per_page);
console.log("LAST PAGE:", result.last_page);
console.log("PRODUCTS:", result.data?.length);

console.log("\nFIRST PRODUCT:", result.data?.[0]?.name);
