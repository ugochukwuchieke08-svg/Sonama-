"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Mail,
  MessageCircle,
  Phone,
  Headphones,
  Package,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "General Enquiry",
    message: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const message = `
Hello SONAMA WILLS Support,

Name: ${form.name}
Email: ${form.email}
Order Number: ${form.orderNumber || "Not provided"}
Enquiry Type: ${form.subject}

Message:
${form.message}
    `.trim();

    const whatsappURL = `https://wa.me/2348068407634?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc]">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">

          <Link href="/" className="flex items-center">
            <img
              src="/images/logo3.png"
              alt="SONAMA WILLS"
              className="h-11 w-auto max-w-[180px] object-contain"
            />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Store
          </Link>

        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0d1d32] px-5 py-16 text-center text-white sm:py-20">

        <div className="mx-auto max-w-3xl">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
            <Headphones size={28} className="text-blue-400" />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            We're Here to Help
          </p>

          <h1 className="text-3xl font-bold sm:text-5xl">
            Contact Our Support Team
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
            Have a question about a product, an order or delivery?
            Get in touch with SONAMA WILLS. Our team is ready to assist you.
          </p>

        </div>

      </section>

      {/* Main Content */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-20">

        {/* Contact Information */}
        <div>

          <h2 className="text-2xl font-bold text-[#102746]">
            Get in Touch
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-500">
            Choose your preferred contact method. We're happy to help
            with product enquiries, orders and general questions.
          </p>

          <div className="mt-8 space-y-5">

            {/* WhatsApp */}
            <a
              href="https://wa.me/2348068407634?text=Hello%20SONAMA%20WILLS%2C%20I%20need%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <MessageCircle size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#102746]">
                  WhatsApp Support
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Chat directly with our support team.
                </p>

                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  +234 806 840 7634
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+2348068407634"
              className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Phone size={22} />
              </div>

              <div>
                <h3 className="font-bold text-[#102746]">
                  Phone Support
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Call us for assistance.
                </p>

                <span className="mt-2 inline-block text-sm font-semibold text-blue-600">
                  +234 806 840 7634
                </span>
              </div>
            </a>

            {/* Email */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Mail size={22} />
                </div>

                <h3 className="font-bold text-[#102746]">
                  Email Support
                </h3>
              </div>

              <div className="mt-5 space-y-4 text-sm">

                <a
                  href="mailto:Support@gmail.com"
                  className="block text-gray-500 transition hover:text-blue-600"
                >
                  <span className="font-semibold text-[#102746]">
                    Customer Support
                  </span>
                  <br />
                  Support@gmail.com
                </a>

                <a
                  href="mailto:Contact@gmail.com"
                  className="block text-gray-500 transition hover:text-blue-600"
                >
                  <span className="font-semibold text-[#102746]">
                    General Enquiries
                  </span>
                  <br />
                  Contact@gmail.com
                </a>

                <a
                  href="mailto:wilsonihe@gmail.com"
                  className="block text-gray-500 transition hover:text-blue-600"
                >
                  <span className="font-semibold text-[#102746]">
                    Business Enquiries
                  </span>
                  <br />
                  wilsonihe@gmail.com
                </a>

              </div>
            </div>

          </div>

          {/* Trust */}
          <div className="mt-8 flex items-start gap-3 rounded-xl bg-blue-50 p-5">
            <ShieldCheck size={23} className="shrink-0 text-blue-600" />

            <div>
              <h3 className="font-bold text-[#102746]">
                Customer Assistance
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                We're committed to helping you with your shopping
                experience, product enquiries and order concerns.
              </p>
            </div>
          </div>

        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">

          <h2 className="text-2xl font-bold text-[#102746]">
            Send Us a Message
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fill in the details below and continue to WhatsApp to send
            your enquiry.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#102746]">
                Full Name *
              </label>

              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#102746]">
                Email Address *
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Order Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#102746]">
                Order Number
                <span className="ml-2 font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={form.orderNumber}
                onChange={(e) =>
                  setForm({ ...form, orderNumber: e.target.value })
                }
                placeholder="Enter your order number"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#102746]">
                Enquiry Type *
              </label>

              <select
                required
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>General Enquiry</option>
                <option>Product Enquiry</option>
                <option>Order Enquiry</option>
                <option>Payment Issue</option>
                <option>Shipping & Delivery</option>
                <option>Returns & Refunds</option>
                <option>Warranty Enquiry</option>
                <option>Other</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#102746]">
                Your Message *
              </label>

              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
                placeholder="How can we help you?"
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1769e0] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#1257bd] hover:shadow-lg"
            >
              Continue to WhatsApp
              <Send size={17} />
            </button>

            <p className="text-center text-xs leading-5 text-gray-400">
              Your message will be prepared in WhatsApp for you to send.
            </p>

          </form>

        </div>

      </section>

      {/* Bottom CTA */}
      <section className="bg-white px-5 py-12 text-center">
        <Package size={30} className="mx-auto text-blue-600" />

        <h2 className="mt-4 text-xl font-bold text-[#102746]">
          Looking for something specific?
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Explore our collection of electronics and home appliances.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1769e0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#1257bd]"
        >
          Browse Products
          <ArrowUpRight size={17} />
        </Link>
      </section>

      {/* Simple Footer */}
      <footer className="bg-[#0d1d32] px-5 py-7 text-center text-xs text-gray-400">
        <p>© 2026 SONAMA WILLS STORE. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-5">
          <Link href="/privacy-policy" className="hover:text-white">
            Privacy Policy
          </Link>

          <Link href="/terms" className="hover:text-white">
            Terms & Conditions
          </Link>

          <Link href="/" className="hover:text-white">
            Back to Store
          </Link>
        </div>
      </footer>

    </main>
  );
}
