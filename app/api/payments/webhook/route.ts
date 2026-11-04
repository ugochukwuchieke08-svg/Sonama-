import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const flutterwaveSecretKey = process.env.FLW_SECRET_KEY;
const flutterwaveSecretHash = process.env.FLW_SECRET_HASH;

function safeCompare(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

export async function POST(request: Request) {
  try {
    if (
      !serviceKey ||
      !supabaseUrl ||
      !flutterwaveSecretKey ||
      !flutterwaveSecretHash
    ) {
      console.error("Missing webhook configuration.");

      return NextResponse.json(
        { error: "Webhook configuration missing." },
        { status: 500 }
      );
    }

    // Read the raw body for signature verification.
    const rawBody = await request.text();

    const signature = request.headers.get(
      "flutterwave-signature"
    );

    const legacySignature = request.headers.get("verif-hash");

    // Support Flutterwave's HMAC signature and legacy secret-hash header.
    const expectedSignature = createHmac(
      "sha256",
      flutterwaveSecretHash
    )
      .update(rawBody)
      .digest("base64");

    const validSignature =
      (!!signature &&
        safeCompare(signature, expectedSignature)) ||
      (!!legacySignature &&
        safeCompare(legacySignature, flutterwaveSecretHash));

    if (!validSignature) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    // Only process completed payment events.
    if (
      payload.event !== "charge.completed" ||
      !payload.data?.id ||
      payload.data.status !== "successful"
    ) {
      return NextResponse.json({ received: true });
    }

    const transactionId = String(payload.data.id);

    if (!/^\d+$/.test(transactionId)) {
      return NextResponse.json({ received: true });
    }

    const supabase = createSupabaseClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the transaction directly with Flutterwave.
    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const verificationData =
      await verificationResponse.json();

    if (
      !verificationResponse.ok ||
      verificationData.status !== "success" ||
      !verificationData.data
    ) {
      console.error(
        "Webhook transaction verification failed:",
        verificationData
      );

      return NextResponse.json(
        { error: "Transaction verification failed." },
        { status: 500 }
      );
    }

    const transaction = verificationData.data;

    // Find the matching order.
    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select(
          "id, order_number, payment_reference, total_amount, payment_status"
        )
        .eq("payment_reference", transaction.tx_ref)
        .eq("payment_method", "flutterwave")
        .maybeSingle();

    if (orderError) {
      console.error("Webhook order lookup error:", orderError);

      return NextResponse.json(
        { error: "Order lookup failed." },
        { status: 500 }
      );
    }

    if (!order) {
      console.error(
        "No order found for transaction:",
        transaction.tx_ref
      );

      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Ignore duplicate notifications.
    if (order.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const expectedAmount = Number(order.total_amount);
    const paidAmount = Number(transaction.amount);

    const isVerified =
      transaction.status === "successful" &&
      transaction.tx_ref === order.payment_reference &&
      transaction.currency === "NGN" &&
      Number.isFinite(expectedAmount) &&
      Number.isFinite(paidAmount) &&
      paidAmount >= expectedAmount;

    if (!isVerified) {
      console.error("Webhook payment mismatch:", {
        orderNumber: order.order_number,
        transactionReference: transaction.tx_ref,
        expectedReference: order.payment_reference,
        expectedAmount,
        paidAmount,
        currency: transaction.currency,
        status: transaction.status,
      });

      return NextResponse.json(
        { error: "Payment details do not match." },
        { status: 400 }
      );
    }

    // Update only pending orders.
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
      })
      .eq("id", order.id)
      .eq("payment_status", "pending");

    if (updateError) {
      console.error("Webhook order update error:", updateError);

      return NextResponse.json(
        { error: "Unable to update order payment." },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Flutterwave webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
} 