import Link from "next/link";
import { redirect } from "next/navigation";
import {
Megaphone,
Plus,
Pencil,
CalendarDays,
Tag,
CheckCircle2,
Clock,
XCircle,
ArrowUpRight,
Image as ImageIcon,
} from "lucide-react";
import PromotionActions from "./PromotionActions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPromotionsPage() {
const supabase = await createClient();

// Verify logged-in user.
const { data: claimsData, error: claimsError } =
await supabase.auth.getClaims();

const userId = claimsData?.claims?.sub;

if (claimsError || !userId) {
redirect("/admin/login");
}

// Verify administrator.
const { data: admin, error: adminError } = await supabase
.from("admin_users")
.select("user_id")
.eq("user_id", userId)
.maybeSingle();

if (adminError || !admin) {
redirect("/admin/login");
}

// Fetch promotions.
const { data: promotions, error } = await supabase
.from("promotions")
.select("*")
.order("created_at", { ascending: false });

const promotionList = promotions ?? [];
const now = new Date();

const activePromotions = promotionList.filter(
(promotion) =>
promotion.is_active &&
(!promotion.starts_at || new Date(promotion.starts_at) <= now) &&
(!promotion.ends_at || new Date(promotion.ends_at) >= now)
).length;

const scheduledPromotions = promotionList.filter(
(promotion) =>
promotion.is_active &&
promotion.starts_at &&
new Date(promotion.starts_at) > now
).length;

const expiredPromotions = promotionList.filter(
(promotion) =>
promotion.ends_at && new Date(promotion.ends_at) < now
).length;

const stats = [
{
label: "Total Promotions",
value: promotionList.length,
icon: Megaphone,
style: "bg-blue-50 text-[#1769e0]",
},
{
label: "Currently Active",
value: activePromotions,
icon: CheckCircle2,
style: "bg-emerald-50 text-emerald-600",
},
{
label: "Scheduled",
value: scheduledPromotions,
icon: Clock,
style: "bg-amber-50 text-amber-600",
},
{
label: "Expired",
value: expiredPromotions,
icon: XCircle,
style: "bg-red-50 text-red-600",
},
];

const formatDate = (date: string | null) => {
if (!date) return "Not specified";

return new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(date));

};

return (
<main className="min-h-screen bg-[#fafafa] text-[#142d4e]">
<header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
<div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
<div>
<div className="flex items-center gap-2 text-xs font-medium text-gray-400">
<span>SONAMA WILLS</span>
<span>/</span>
<span>Marketing</span>
</div>

        <h1 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">
          Promotions
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage discounts, campaigns and promotional banners.
        </p>
      </div>

      <Link
        href="/admin/promotions/new"
        className="inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1255b9]"
      >
        <Plus size={18} />
        Create Promotion
      </Link>
    </div>
  </header>

  <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
    {/* Statistics */}
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                {stat.label}
              </p>

              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.style}`}>
                <Icon size={21} />
              </div>
            </div>

            <p className="mt-5 text-2xl font-extrabold">
              {stat.value}
            </p>
          </article>
        );
      })}
    </div>

    {/* Promotions list */}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">
          All Promotions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {promotionList.length} promotion
          {promotionList.length === 1 ? "" : "s"} in your database
        </p>
      </div>

      {error ? (
        <div className="p-10 text-center text-sm text-red-600">
          Unable to load promotions: {error.message}
        </div>
      ) : promotionList.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1769e0]">
            <Megaphone size={30} />
          </div>

          <h3 className="mt-4 text-lg font-extrabold">
            No promotions yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            Create your first promotional campaign to start highlighting
            special offers on your store.
          </p>

          <Link
            href="/admin/promotions/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus size={18} />
            Create First Promotion
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          {promotionList.map((promotion) => {
            const isExpired =
              promotion.ends_at &&
              new Date(promotion.ends_at) < now;

            const isScheduled =
              promotion.starts_at &&
              new Date(promotion.starts_at) > now;

            const isCurrentlyActive =
              promotion.is_active &&
              !isExpired &&
              !isScheduled;

            return (
              <article
                key={promotion.id}
                className="overflow-hidden rounded-2xl border border-gray-200 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="relative h-48 bg-[#f3f6fb]">
                  {promotion.image_url ? (
                    <img
                      src={promotion.image_url}
                      alt={promotion.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <ImageIcon size={42} />
                    </div>
                  )}

                  {promotion.discount_label && (
                    <span className="absolute left-3 top-3 rounded-lg bg-[#e87928] px-3 py-1.5 text-xs font-black text-white">
                      {promotion.discount_label}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold">
                        {promotion.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        {promotion.description || "No description provided."}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isCurrentlyActive
                          ? "bg-emerald-50 text-emerald-700"
                          : isScheduled
                            ? "bg-amber-50 text-amber-700"
                            : isExpired
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isCurrentlyActive
                        ? "Active"
                        : isScheduled
                          ? "Scheduled"
                          : isExpired
                            ? "Expired"
                            : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={15} />
                      <span>
                        Starts: {formatDate(promotion.starts_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={15} />
                      <span>
                        Ends: {formatDate(promotion.ends_at)}
                      </span>
                    </div>
                  </div>

                 <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
    <Tag size={14} />
    {promotion.button_text || "Shop Now"}
  </span>

  <div className="flex flex-wrap items-center gap-2">
    <Link
      href={`/admin/promotions/${promotion.id}/edit`}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-[#1769e0] transition hover:border-blue-200 hover:bg-blue-50"
    >
      <Pencil size={14} />
      Edit
      <ArrowUpRight size={13} />
    </Link>

    <PromotionActions
      id={promotion.id}
      isActive={promotion.is_active}
      imageUrl={promotion.image_url}
    />
  </div>
</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>

    <footer className="mt-8 border-t border-gray-200 pt-5">
      <p className="text-xs font-medium text-gray-400">
        SONAMA WILLS · Promotion management
      </p>
    </footer>
  </div>
</main>

);
}