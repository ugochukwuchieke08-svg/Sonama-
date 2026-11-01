import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

async function getAdminClient() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError || !admin) {
    return { error: "Forbidden", status: 403 };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { error: "Server configuration error", status: 500 };
  }

  const adminClient = createSupabaseClient(
    supabaseUrl,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return { adminClient };
}

export async function POST(request: Request) {
  try {
    const result = await getAdminClient();

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { action, orderId } = body;

    if (action !== "details" || !orderId) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { data: items, error } = await result.adminClient
      .from("order_items")
      .select(
        "id, product_name, product_image, quantity, unit_price, line_total"
      )
      .eq("order_id", orderId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: (items || []).map((item) => ({
        id: item.id,
        name: item.product_name,
        image: item.product_image,
        quantity: item.quantity,
        price: item.unit_price,
        lineTotal: item.line_total,
      })),
    });
  } catch (error) {
    console.error("Order details error:", error);

    return NextResponse.json(
      { error: "Failed to load order details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getAdminClient();

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    const { orderId, status } = body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      !orderId ||
      typeof orderId !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid order ID or status" },
        { status: 400 }
      );
    }

    const { data, error } = await result.adminClient
      .from("orders")
      .update({
        status,
        order_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, status, order_status")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error("Order status update error:", error);

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}