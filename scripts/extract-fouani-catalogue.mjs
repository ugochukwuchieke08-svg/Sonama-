import fs from "node:fs";

const BASE_URL = "https://fouanistore.com";
const SHOP_FILE = "scripts/fouani-shop.html";
const OUTPUT_FILE = "scripts/fouani-catalogue.json";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function extractProductLinks(html) {
  const matches = [
    ...html.matchAll(/<a\b[^>]*href=["']([^"']*\/product\/[^"']+)["']/gi),
  ];

  return [
    ...new Set(
      matches.map((match) =>
        new URL(match[1].replace(/&amp;/g, "&"), BASE_URL).href
      )
    ),
  ];
}

function extractJsonLd(html) {
  const scripts = [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1]);

      const items = Array.isArray(parsed) ? parsed : [parsed];

      const product = items.find(
        (item) => item?.["@type"] === "Product"
      );

      if (product) return product;
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return null;
}

async function main() {
  if (!fs.existsSync(SHOP_FILE)) {
    throw new Error(`Shop file not found: ${SHOP_FILE}`);
  }

  const shopHtml = fs.readFileSync(SHOP_FILE, "utf8");
  const productLinks = extractProductLinks(shopHtml);

  console.log(`Found ${productLinks.length} product links.\n`);

  const catalogue = [];
  const failed = [];

  for (let i = 0; i < productLinks.length; i++) {
    const url = productLinks[i];

    console.log(`[${i + 1}/${productLinks.length}] ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const product = extractJsonLd(html);

      if (!product) {
        throw new Error("Product JSON-LD not found");
      }

      const offer = Array.isArray(product.offers)
        ? product.offers[0]
        : product.offers;

      const image = Array.isArray(product.image)
        ? product.image[0]
        : product.image;

      catalogue.push({
        name: product.name ?? "",
        brand:
          typeof product.brand === "object"
            ? product.brand?.name ?? ""
            : product.brand ?? "",
        sku: product.sku ?? "",
        description: product.description ?? "",
        supplier_price: offer?.price
          ? Number(offer.price)
          : null,
        currency: offer?.priceCurrency ?? "",
        availability: offer?.availability ?? "",
        image_url: image ?? "",
        source_url: url,
        condition: offer?.itemCondition ?? "",
      });

      console.log(`  ✓ ${product.name ?? "Unnamed product"}`);
    } catch (error) {
      failed.push({
        url,
        error: error.message,
      });

      console.log(`  ✗ ${error.message}`);
    }

    // Avoid sending requests too quickly.
    await sleep(1200);
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        extracted_at: new Date().toISOString(),
        total_found: productLinks.length,
        total_extracted: catalogue.length,
        total_failed: failed.length,
        products: catalogue,
        failed,
      },
      null,
      2
    )
  );

  console.log("\n========== COMPLETE ==========");
  console.log("Products found:", productLinks.length);
  console.log("Successfully extracted:", catalogue.length);
  console.log("Failed:", failed.length);
  console.log("Saved to:", OUTPUT_FILE);
}

main().catch(console.error);