"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Power, Trash2, Loader2 } from "lucide-react";

type Props = {
  id: string;
  isActive: boolean;
  imageUrl: string | null;
};

export default function PromotionActions({
  id,
  isActive,
  imageUrl,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState<"toggle" | "delete" | null>(
    null
  );

  const handleToggle = async () => {
    setLoading("toggle");

    const { error } = await supabase
      .from("promotions")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      alert(error.message);
      setLoading(null);
      return;
    }

    router.refresh();
    setLoading(null);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this promotion?"
    );

    if (!confirmed) return;

    setLoading("delete");

    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      setLoading(null);
      return;
    }

    // Remove the uploaded image from Supabase Storage.
    if (imageUrl) {
      try {
        const marker = "/storage/v1/object/public/promotion-images/";

        if (imageUrl.includes(marker)) {
          const imagePath = decodeURIComponent(
            imageUrl.split(marker)[1].split("?")[0]
          );

          const { error: storageError } = await supabase.storage
            .from("promotion-images")
            .remove([imagePath]);

          if (storageError) {
            console.error(
              "Promotion deleted, but image cleanup failed:",
              storageError.message
            );
          }
        }
      } catch (error) {
        console.error("Image cleanup failed:", error);
      }
    }

    router.refresh();
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading !== null}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
          isActive
            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {loading === "toggle" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Power size={14} />
        )}

        {isActive ? "Deactivate" : "Activate"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {loading === "delete" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}

        Delete
      </button>
    </div>
  );
}