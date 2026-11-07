import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const flutterwaveSecretKey = process.env.FLW_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: Request) {
  try {
    if (!serviceKey || !supabaseUrl) {
      console.error("Missing Supabase server configuration.");

      return NextResponse.json(
        { error: "Server database configuration is missing." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customer, items, paymentMethod } = body;


    const isFlutterwave =
  paymentMethod === "online" ||
  paymentMethod === "flutterwave";

if (!isFlutterwave) {
  return NextResponse.json(
    { error: "Only online payment through Flutterwave is supported." },
    { status: 400 }
  );
}

    if (!flutterwaveSecretKey || !siteUrl) {
      console.error("Missing Flutterwave server configuration.");

      return NextResponse.json(
        { error: "Online payment is temporarily unavailable." },
        { status: 500 }
      );
    }

    if (
      !customer ||
      typeof customer !== "object" ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid order information." },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: "Too many different products in one order." },
        { status: 400 }
      );
    }

    // Validate customer information.

    const requiredFields = [
      customer.fullName,
      customer.email,
      customer.phone,
      customer.address,
      customer.city,
      customer.state,
    ];

    if (
      requiredFields.some(
        (value) =>
          typeof value !== "string" ||
          !value.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Please complete all required customer details." },
        { status: 400 }
      );
    }

    const email = customer.email.trim().toLowerCase();
    const phone = customer.phone.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!/^[0-9+\s()-]{7,20}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    // Validate cart items.

    const normalizedItems = items.map((item: any) => ({
      id: String(item.id || ""),
      quantity: Number(item.quantity),
    }));

    const seenIds = new Set<string>();

    for (const item of normalizedItems) {
      if (
        !item.id ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100 ||
        seenIds.has(item.id)
      ) {
        return NextResponse.json(
          { error: "Invalid product information in your cart." },
          { status: 400 }
        );
      }

      seenIds.add(item.id);
    }

    const adminSupabase = createSupabaseClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Require an authenticated and email-confirmed customer.

const sessionSupabase = await createClient();

const {
  data: { user },
  error: authError,
} = await sessionSupabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "Please log in before placing your order." },
    { status: 401 }
  );
}

if (!user.email || !user.email_confirmed_at) {
  return NextResponse.json(
    { error: "Please confirm your email address before placing an order." },
    { status: 403 }
  );
}

if (email !== user.email.trim().toLowerCase()) {
  return NextResponse.json(
    {
      error:
        "Please use the email address associated with your SONAMA WILLS account.",
    },
    { status: 400 }
  );
}

    // Retrieve actual products and prices from Supabase.

    const productIds = normalizedItems.map(
      (item) => item.id
    );

    const { data: products, error: productError } =
      await adminSupabase
        .from("products")
        .select(
          "id, name, price, stock_quantity, image_url, is_active"
        )
        .in("id", productIds);

    if (productError || !products) {
      console.error("Product lookup error:", productError);

      return NextResponse.json(
        { error: "Unable to verify your cart. Please try again." },
        { status: 500 }
      );
    }

    if (products.length !== normalizedItems.length) {
      return NextResponse.json(
        { error: "Some products are no longer available." },
        { status: 400 }
      );
    }

    // Calculate prices using database values.

    const orderItems = [];
    let subtotal = 0;

    for (const item of normalizedItems) {
      const product = products.find(
        (product) => String(product.id) === item.id
      );

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: "A product in your cart is no longer available." },
          { status: 400 }
        );
      }

      if (Number(product.stock_quantity) < item.quantity) {
        return NextResponse.json(
          {
            error: `Only ${product.stock_quantity} units of ${product.name} are currently available.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json(
          { error: "Invalid product pricing." },
          { status: 500 }
        );
      }

      const lineTotal = Number(
        (unitPrice * item.quantity).toFixed(2)
      );

      subtotal += lineTotal;

      orderItems.push({
        product_id: String(product.id),
        product_name: product.name,
        product_image: product.image_url || null,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // Generate order number and payment reference.

    const orderNumber = `SW-${Date.now()}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;

    const txRef = `SW-PAY-${randomUUID()}`;

    const customerNotes =
      typeof customer.notes === "string"
        ? customer.notes.trim() || null
        : null;

    // Save the main order.

    const { data: savedOrder, error: orderError } =
      await adminSupabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,

          customer_name: customer.fullName.trim(),
          customer_email: email,
          customer_phone: phone,

          delivery_address: customer.address.trim(),
          delivery_city: customer.city.trim(),
          delivery_state: customer.state.trim(),

          notes: customerNotes,
          customer_notes: customerNotes,

          subtotal,
          delivery_fee: 0,

          // total_amount is generated by Supabase.
          payment_method: "flutterwave",

          payment_status: "pending",
          payment_reference: txRef,

          status: "pending",
          order_status: "pending",
        })
        .select("id, order_number")
        .single();

    if (orderError || !savedOrder) {
      console.error("Order creation error:", orderError);

      return NextResponse.json(
       { error: "We couldn't save your order. Please try again." },
        { status: 500 }
      );
    }

    // Save order items.

    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: savedOrder.id,
    }));

    const { error: itemsError } = await adminSupabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Order items error:", itemsError);

      const { error: rollbackError } = await adminSupabase
        .from("orders")
        .delete()
        .eq("id", savedOrder.id);

      if (rollbackError) {
        console.error("Order rollback error:", rollbackError);
      }

      return NextResponse.json(
        { error: "We couldn't save your order items. Please try again." },
        { status: 500 }
      );
    }

    // Flutterwave: initialize hosted checkout.

    const callbackUrl = `${siteUrl.replace(/\/+$/, "")}/api/payments/callback`;

    const flutterwaveResponse = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: subtotal,
          currency: "NGN",
          redirect_url: callbackUrl,

          customer: {
            email,
            name: customer.fullName.trim(),
            phonenumber: phone,
          },

          customizations: {
            title: "SONAMA WILLS STORE",
            description: `Payment for order ${savedOrder.order_number}`,
          },

          meta: {
            order_id: savedOrder.id,
            order_number: savedOrder.order_number,
          },
        }),
      }
    );

    const flutterwaveData = await flutterwaveResponse.json();

    if (
      !flutterwaveResponse.ok ||
      flutterwaveData.status !== "success" ||
      !flutterwaveData.data?.link
    ) {
      console.error(
        "Flutterwave initialization error:",
        flutterwaveData
      );

      await adminSupabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", savedOrder.id);

      return NextResponse.json(
        {
          error:
  "We couldn't start your online payment. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        paymentMethod: "flutterwave",
        orderNumber: savedOrder.order_number,
        total: subtotal,
        checkoutUrl: flutterwaveData.data.link,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while placing your order." },
      { status: 500 }
    );
  }
}