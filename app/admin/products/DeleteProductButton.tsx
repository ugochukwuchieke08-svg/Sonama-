"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, LoaderCircle, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
  isActive: boolean;
};

export default function DeleteProductButton({
  productId,
  productName,
  isActive,
}: DeleteProductButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDeactivate() {
    if (loading) return;

    const action = isActive ? "deactivate" : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${productName}"?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("products")
        .update({ is_active: !isActive })
        .eq("id", productId)
        .select("id, name, is_active");

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data || data.length === 0) {
        throw new Error(
          "No product was updated. Check the product ID and your Supabase update permissions."
        );
      }

      window.alert(
        `"${productName}" has been ${
          isActive ? "deactivated" : "reactivated"
        } successfully.`
      );

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the product.";

      console.error("Product status update failed:", err);

      setError(message);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleDeactivate}
        disabled={loading}
        title={isActive ? "Deactivate product" : "Reactivate product"}
        aria-label={`${isActive ? "Deactivate" : "Reactivate"} ${productName}`}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 disabled:cursor-wait disabled:opacity-50 ${
          isActive
            ? "border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-300"
            : "border-green-200 text-green-600 hover:bg-green-50 focus:ring-green-300"
        }`}
      >
        {loading ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : isActive ? (
          <Trash2 size={17} />
        ) : (
          <RotateCcw size={17} />
        )}
      </button>

      {error && (
        <p
          role="alert"
          className="absolute right-0 top-10 z-20 w-64 rounded-lg border border-red-200 bg-white p-3 text-xs leading-5 text-red-600 shadow-lg"
        >
          {error}
        </p>
      )}
    </div>
  );
}