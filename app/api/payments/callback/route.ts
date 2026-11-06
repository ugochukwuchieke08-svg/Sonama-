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
  const url = new URL("/checkout", siteUrl!);

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

    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");

    if (!txRef || !transactionId || !/^\d+$/.test(transactionId)) {
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

    // Find the original order.

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, total_amount, payment_method, payment_status, payment_reference"
      )
      .eq("payment_reference", txRef)
      .eq("payment_method", "flutterwave")
      .maybeSingle();

    if (orderError || !order) {
      console.error("Payment order lookup failed:", orderError);

      return redirectToCheckout("failed");
    }

    // Already-paid orders must never be processed again.

    if (order.payment_status === "paid") {
      return redirectToCheckout(
        "success",
        order.order_number
      );
    }

    // Verify directly with Flutterwave.
    // Never trust the browser callback alone.

    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!verificationResponse.ok) {
      console.error(
        "Flutterwave verification HTTP error:",
        verificationResponse.status
      );

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    const verificationData = await verificationResponse.json();

    if (
      verificationData.status !== "success" ||
      !verificationData.data
    ) {
      console.error(
        "Flutterwave transaction verification failed."
      );

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    const transaction = verificationData.data;

    // Validate the verified transaction.

    const expectedAmount = Number(order.total_amount);
    const paidAmount = Number(transaction.amount);

    const isVerified =
      String(transaction.id) === transactionId &&
      transaction.status === "successful" &&
      transaction.tx_ref === order.payment_reference &&
      transaction.currency === "NGN" &&
      Number.isFinite(expectedAmount) &&
      Number.isFinite(paidAmount) &&
      expectedAmount > 0 &&
      paidAmount >= expectedAmount;

    if (!isVerified) {
      console.error("Payment verification mismatch:", {
        orderNumber: order.order_number,
        transactionId: transaction.id,
        transactionStatus: transaction.status,
        transactionReference: transaction.tx_ref,
        expectedReference: order.payment_reference,
        expectedAmount,
        paidAmount,
        currency: transaction.currency,
      });

      return redirectToCheckout(
        "failed",
        order.order_number
      );
    }

    // Log overpayments for reconciliation.

    if (paidAmount > expectedAmount) {
      console.warn("Flutterwave overpayment detected:", {
        orderNumber: order.order_number,
        expectedAmount,
        paidAmount,
        difference: paidAmount - expectedAmount,
      });
    }

    // Atomically mark the order as paid.
    // Only pending orders can be updated.

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
      console.error(
        "Order payment update failed:",
        updateError
      );

      return NextResponse.json(
        { error: "Payment verified but order update failed." },
        { status: 500 }
      );
    }

    // Handle simultaneous callbacks safely.

    if (!updatedOrder) {
      const { data: latestOrder, error: latestError } =
        await supabase
          .from("orders")
          .select("payment_status")
          .eq("id", order.id)
          .maybeSingle();

      if (
        latestError ||
        latestOrder?.payment_status !== "paid"
      ) {
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
    console.error("Flutterwave callback error:", error);

    return NextResponse.json(
      { error: "Unable to process payment verification." },
      { status: 500 }
    );
  }
}