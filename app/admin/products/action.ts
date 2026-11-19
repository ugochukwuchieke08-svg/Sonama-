"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProductReview(
  productId: string,
  reviewed: boolean
) {
  const supabase = await createClient();

  // Verify logged-in user
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { success: false, error: "Unauthorized." };
  }

  // Verify administrator
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!admin) {
    return { success: false, error: "Admin access required." };
  }

  // Save review status
  const { error } = await supabase
    .from("products")
    .update({
      reviewed_at: reviewed ? new Date().toISOString() : null,
    })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}