import fs from "node:fs";

const BASE_URL = "https://fouanistore.com";
const SHOP_URL = `${BASE_URL}/nigeria-en/shop`;

const OUTPUT_FILE = "scripts/fouani-full-catalogue.json";
const CHECKPOINT_FILE = "scripts/fouani-full-catalogue.progress.json";

const PAGE_DELAY = 700;
const PRODUCT_DELAY = 1200;
const SAVE_EVERY = 10;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const headers = {
  "User-Agent": "Mozilla/5.0",
  Accept: "text/html",
};

function extractNextData(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error("Next.js page data not found");
  }

  return JSON.parse(match[1]);
}

async function fetchPage(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(attempt * 2000);
      }
    }
  }

  throw lastError;
}

async function getCataloguePages() {
  console.log("Fetching catalogue pages...\n");

  const firstHtml = await fetchPage(SHOP_URL);
  const firstData = extractNextData(firstHtml);
  const firstCatalogue = firstData.props?.pageProps?.data;

  if (!firstCatalogue?.data) {
    throw new Error("Could not read first catalogue page");
  }

  const lastPage = Number(firstCatalogue.last_page);

  if (!lastPage || lastPage < 1) {
    throw new Error("Invalid catalogue page count");
  }

  const productsById = new Map();
  const linksById = new Map();

  function collect(html, catalogue) {
    for (const product of catalogue.data) {
      productsById.set(String(product.id), product);
    }

    const matches = html.matchAll(
      /<a\b[^>]*href=["']([^"']*\/product\/\d+[^"']*)["']/gi
    );

    for (const match of matches) {
      const href = match[1].replace(/&amp;/g, "&");
      const idMatch = href.match(/\/product\/(\d+)/);

      if (!idMatch) continue;

      const id = idMatch[1];
      linksById.set(id, new URL(href, BASE_URL).href);
    }
  }

  collect(firstHtml, firstCatalogue);

  console.log(
    `Page 1/${lastPage}: ${firstCatalogue.data.length} products`
  );

  for (let page = 2; page <= lastPage; page++) {
    const html = await fetchPage(`${SHOP_URL}?page=${page}`);
    const data = extractNextData(html);
    const catalogue = data.props?.pageProps?.data;

    if (!catalogue?.data) {
      throw new Error(`Product data missing on page ${page}`);
    }

    collect(html, catalogue);

    console.log(
      `Page ${page}/${lastPage}: ${catalogue.data.length} products`
    );

    await sleep(PAGE_DELAY);
  }

  const products = [...productsById.values()];

  for (const product of products) {
    const id = String(product.id);

    if (!linksById.has(id)) {
      linksById.set(
        id,
        `${BASE_URL}/nigeria-en/product/${id}`
      );
    }
  }

  console.log("\nCatalogue collection complete.");
  console.log("Unique product IDs:", products.length);
  console.log("Product links:", linksById.size);

  return products.map((product) => ({
    listing: product,
    url: linksById.get(String(product.id)),
  }));
}

function getJsonLdProduct(html) {
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
      // Ignore invalid JSON-LD.
    }
  }

  return null;
}

function getOffer(product, jsonLd) {
  const offers = jsonLd?.offers;

  return Array.isArray(offers) ? offers[0] : offers;
}

function getBranch(product) {
  const branch = product.product_branch;

  return Array.isArray(branch) ? branch[0] : branch;
}

function getImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      url: image,
      webp_url: "",
      thumbnail_url: "",
    };
  }

  if (typeof image !== "object") return null;

  const base = image.base_url ?? "";

  const buildUrl = (value) => {
    if (!value) return "";

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (!base) return "";

    return `${base.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
  };

  const url = buildUrl(image.origin);

  if (!url) return null;

  return {
    url,
    webp_url: buildUrl(image.webp_image),
    thumbnail_url: buildUrl(
      image.webp_thumbnail ?? image.thumbnail
    ),
    id: image.id ?? null,
  };
}

function collectImages(product, listing, jsonLd) {
  const images = [];
  const seen = new Set();

  function add(value) {
    const image = getImage(value);

    if (!image || seen.has(image.url)) return;

    seen.add(image.url);
    images.push(image);
  }

  // Primary image.
  add(product.image);

  // Full product gallery.
  if (Array.isArray(product.images)) {
    for (const image of product.images) {
      add(image);
    }
  }

  // Additional picture attachments.
  if (Array.isArray(product.attachments)) {
    for (const attachment of product.attachments) {
      if (attachment?.image) {
        add(attachment.image);
      }
    }
  }

  // Listing image as a fallback.
  if (listing?.image) {
    add(listing.image);
  }

  // JSON-LD fallback.
  if (images.length === 0 && jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];

    for (const image of jsonImages) {
      add(image);
    }
  }

  return images;
}

function getNumericPrice(...values) {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return null;
}

function extractProduct(html, listing, url) {
  const data = extractNextData(html);

  const product = data.props?.pageProps?.data?.data;

  if (!product || typeof product !== "object") {
    throw new Error("Product detail data not found");
  }

  const jsonLd = getJsonLdProduct(html);
  const offer = getOffer(product, jsonLd);
  const branch = getBranch(product);

  const images = collectImages(product, listing, jsonLd);

  const supplierPrice = getNumericPrice(
    offer?.price,
    branch?.price,
    product.price,
    listing?.price
  );

  const brand =
    product.brand?.name ??
    product.brand_name ??
    listing?.brand?.name ??
    "";

  const sku =
    branch?.sku ??
    product.sku ??
    listing?.product_branch?.sku ??
    "";

  const availability =
    offer?.availability ??
    product.availability ??
    "";

  return {
    id: product.id ?? listing.id,
    uuid: product.uuid ?? listing.uuid ?? "",
    name: product.name ?? listing.name ?? "",
    brand,
    sku,
    description: product.description ?? listing.description ?? "",
    supplier_price: supplierPrice,
    currency: offer?.priceCurrency ?? "NGN",
    availability,
    stock_quantity: product.display_quantity ??
      listing.display_quantity ?? null,
    image_url: images[0]?.url ?? "",
    images,
    image_count: images.length,
    source_url: url,
    condition: offer?.itemCondition ?? "",
    extracted_at: new Date().toISOString(),
  };
}

function saveCheckpoint(products, failed, totalFound) {
  const output = {
    extracted_at: new Date().toISOString(),
    total_found: totalFound,
    total_extracted: products.length,
    total_failed: failed.length,
    products,
    failed,
  };

  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify(output, null, 2)
  );
}

async function main() {
  const productLinks = await getCataloguePages();

  let catalogue = [];
  let failed = [];

  // Resume from the previous checkpoint.
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const previous = JSON.parse(
      fs.readFileSync(CHECKPOINT_FILE, "utf8")
    );

    catalogue = previous.products ?? [];
    failed = previous.failed ?? [];

    console.log("\nPrevious progress found.");
    console.log("Already extracted:", catalogue.length);
  }

  const completedIds = new Set(
    catalogue.map((product) => String(product.id))
  );

  const failedMap = new Map(
    failed.map((item) => [String(item.id), item])
  );

  const pending = productLinks.filter(
    ({ listing }) => !completedIds.has(String(listing.id))
  );

  console.log("\n========== EXTRACTION ==========");
  console.log("Total products:", productLinks.length);
  console.log("Already completed:", completedIds.size);
  console.log("Remaining:", pending.length);

  for (let i = 0; i < pending.length; i++) {
    const { listing, url } = pending[i];
    const id = String(listing.id);

    console.log(
      `\n[${i + 1}/${pending.length}] ${listing.name}`
    );

    try {
      const html = await fetchPage(url);
      const product = extractProduct(html, listing, url);

      if (!product.name || !product.supplier_price) {
        throw new Error(
          "Missing product name or supplier price"
        );
      }

      catalogue.push(product);
      failedMap.delete(id);

      console.log(
        `  OK | ₦${product.supplier_price.toLocaleString("en-NG")} | ${product.image_count} images`
      );
    } catch (error) {
      failedMap.set(id, {
        id,
        name: listing.name,
        url,
        error: error.message,
      });

      console.log(`  FAILED: ${error.message}`);
    }

    failed = [...failedMap.values()];

    if ((i + 1) % SAVE_EVERY === 0) {
      saveCheckpoint(
        catalogue,
        failed,
        productLinks.length
      );

      console.log("\nProgress saved.");
    }

    await sleep(PRODUCT_DELAY);
  }

  saveCheckpoint(
    catalogue,
    failed,
    productLinks.length
  );

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        extracted_at: new Date().toISOString(),
        total_found: productLinks.length,
        total_extracted: catalogue.length,
        total_failed: failed.length,
        total_images: catalogue.reduce(
          (sum, product) => sum + product.image_count,
          0
        ),
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
  console.log(
    "Total images:",
    catalogue.reduce(
      (sum, product) => sum + product.image_count,
      0
    )
  );
  console.log("Saved to:", OUTPUT_FILE);
  console.log("Checkpoint:", CHECKPOINT_FILE);
}

main().catch(console.error);