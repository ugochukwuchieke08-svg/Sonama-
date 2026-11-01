import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Server configuration is missing." },
        { status: 500 }
      );
    }

    const { orderNumber, email } = await request.json();

    if (
      typeof orderNumber !== "string" ||
      typeof email !== "string" ||
      !orderNumber.trim() ||
      !email.trim()
    ) {
      return NextResponse.json(
        { error: "Enter your order number and email address." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        delivery_city,
        delivery_state,
        subtotal,
        delivery_fee,
        total_amount,
        payment_method,
        payment_status,
        status,
        created_at
      `)
      .eq("order_number", orderNumber.trim())
      .ilike("customer_email", email.trim())
      .maybeSingle();

    if (orderError) {
      console.error("Order tracking error:", orderError);

      return NextResponse.json(
        { error: "Unable to retrieve your order. Please try again." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "No order matched those details. Please check and try again." },
        { status: 404 }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        product_name,
        product_image,
        quantity,
        unit_price,
        line_total
      `)
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Order items tracking error:", itemsError);

      return NextResponse.json(
        { error: "Unable to retrieve your order items." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.delivery_address,
        city: order.delivery_city,
        state: order.delivery_state,
        total: Number(order.total_amount),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        status: order.status,
        createdAt: order.created_at,
        items: (items || []).map((item) => ({
          id: item.id,
          name: item.product_name,
          price: Number(item.unit_price),
          quantity: item.quantity,
          image: item.product_image,
          lineTotal: Number(item.line_total),
        })),
      },
    });

  } catch (error) {
    console.error("Order tracking API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while tracking your order." },
      { status: 500 }
    );
  }
}