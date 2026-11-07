"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [redirectTo, setRedirectTo] = useState("/account");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRedirect = params.get("redirect");

    if (
      requestedRedirect?.startsWith("/") &&
      !requestedRedirect.startsWith("//") &&
      !requestedRedirect.startsWith("/\\")
    ) {
      setRedirectTo(requestedRedirect);
    }
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (
          error.code === "email_not_confirmed" ||
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          setError(
            "Your email address has not been confirmed. Please check your inbox and confirm your email before logging in."
          );
        } else if (error.code === "invalid_credentials") {
          setError(
            "Invalid email or password. Please check your login details. If you just registered, make sure your email confirmation was successful."
          );
        } else {
          setError(error.message);
        }

        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8">

        {/* SONAMA WILLS Logo */}
        <Link href="/" className="mb-8 flex justify-center">
          <img
            src="/images/logo3.png"
            alt="SONAMA WILLS - Home of All Appliances"
            className="h-20 w-auto max-w-[280px] object-contain sm:h-24 sm:max-w-[320px]"
          />
        </Link>

        <Link
          href="/"
          className="text-sm font-semibold text-gray-500 transition hover:text-[#1769e0]"
        >
          ← Back to store
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Log in to manage your SONAMA WILLS orders.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email address
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-[#1769e0]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-200 text-black px-4 py-3 outline-none focus:border-[#1769e0]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1769e0] px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-[#1769e0] hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}