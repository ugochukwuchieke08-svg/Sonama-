import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const flutterwaveSecretKey = process.env.FLW_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

function redirectToCheckout(
  status: "success" | "failed",
  orderNumber?: string
) {
  const url = new URL("/checkout", siteUrl);

  url.searchParams.set("payment", status);

  if (orderNumber) {
    url.searchParams.set("orderNumber", orderNumber);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  try {
    if (
      !serviceKey ||
      !supabaseUrl ||
      !flutterwaveSecretKey ||
      !siteUrl
    ) {
      console.error("Missing payment callback configuration.");

      return NextResponse.json(
        { error: "Payment verification configuration is missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");

    if (!txRef) {
      return redirectToCheckout("failed");
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

    // Find the order using our unique payment reference.

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, subtotal, delivery_fee, total_amount, payment_method, payment_status, payment_reference"
      )
      .eq("payment_reference", txRef)
      .eq("payment_method", "flutterwave")
      .maybeSingle();

    if (orderError || !order) {
      console.error("Payment order lookup error:", orderError);

      return redirectToCheckout("failed");
    }

    // Do not process an order that has already been paid.

    if (order.payment_status === "paid") {
      return redirectToCheckout(
        "success",
        order.order_number
      );
    }

    // Handle cancelled or unsuccessful payment attempts.

    if (status !== "successful" || !transactionId) {
      if (
        status === "cancelled" ||
        status === "failed"
      ) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id)
          .eq("payment_status", "pending");
      }

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    // Validate transaction ID.

    if (!/^\d+$/.test(transactionId)) {
      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    // Verify directly with Flutterwave.

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
        "Flutterwave verification error:",
        verificationData
      );

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    const transaction = verificationData.data;

    const expectedAmount = Number(order.total_amount);
    const paidAmount = Number(transaction.amount);

    // Verify every important transaction detail.

    const isVerified =
      transaction.status === "successful" &&
      transaction.tx_ref === order.payment_reference &&
      transaction.currency === "NGN" &&
      Number.isFinite(paidAmount) &&
      Number.isFinite(expectedAmount) &&
      paidAmount >= expectedAmount;

    if (!isVerified) {
      console.error("Payment verification mismatch:", {
        orderNumber: order.order_number,
        transactionStatus: transaction.status,
        transactionReference: transaction.tx_ref,
        expectedReference: order.payment_reference,
        paidAmount,
        expectedAmount,
        currency: transaction.currency,
      });

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    // Mark the order as paid.
    // Keep the fulfillment status pending for admin processing.

    const { data: updatedOrder, error: updateError } =
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
        })
        .eq("id", order.id)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();

    if (updateError) {
      console.error("Order payment update error:", updateError);

      return NextResponse.json(
        { error: "Payment was verified but order update failed." },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      // Another callback may already have processed the payment.
      const { data: latestOrder } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", order.id)
        .single();

      if (latestOrder?.payment_status !== "paid") {
        return NextResponse.json(
          { error: "Unable to confirm payment status." },
          { status: 500 }
        );
      }
    }

    return redirectToCheckout(
      "success",
      order.order_number
    );

  } catch (error) {
    console.error("Payment callback error:", error);

    return NextResponse.json(
      { error: "Unable to process payment verification." },
      { status: 500 }
    );
  }
}