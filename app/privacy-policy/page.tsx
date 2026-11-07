import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Database,
  CreditCard,
  MessageCircle,
  UserCheck,
} from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content: (
      <>
        <p>
          When you use SONAMA WILLS STORE, we may collect the following
          information:
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong>Personal Information:</strong> Your name, email address,
            phone number and other details you provide when creating an
            account.
          </li>
          <li>
            <strong>Order Information:</strong> Products purchased, order
            numbers, delivery information and transaction details.
          </li>
          <li>
            <strong>Payment Information:</strong> Payment transaction
            references and payment status. Online payments are processed
            through Flutterwave.
          </li>
          <li>
            <strong>Communication Information:</strong> Messages and
            information you voluntarily provide when contacting us.
          </li>
          <li>
            <strong>Technical Information:</strong> Certain technical
            information may be processed by our website hosting and service
            providers when you access the store.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: UserCheck,
    title: "2. How We Use Your Information",
    content: (
      <>
        <p>We use collected information to:</p>

        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Create and manage customer accounts.</li>
          <li>Process and manage customer orders.</li>
          <li>Verify payments and maintain transaction records.</li>
          <li>Arrange order fulfilment and delivery.</li>
          <li>Respond to customer enquiries and complaints.</li>
          <li>Improve our website, products and shopping experience.</li>
          <li>Protect our store against fraudulent or unauthorized activity.</li>
        </ul>
      </>
    ),
  },
  {
    icon: CreditCard,
    title: "3. Payments and Third-Party Services",
    content: (
      <>
        <p>
          SONAMA WILLS uses third-party services to support its operations.
          These services may process information necessary to provide their
          respective services.
        </p>

        <p className="mt-3">
          <strong>Flutterwave:</strong> Online payments are processed through
          Flutterwave. Payment information is handled according to
          Flutterwave's applicable privacy and security practices.
        </p>

        <p className="mt-3">
          <strong>Supabase:</strong> We use Supabase to support customer
          authentication and the storage of relevant account, product and
          order information.
        </p>

        <p className="mt-3">
          <strong>WhatsApp:</strong> If you contact us through WhatsApp,
          information you send is processed through WhatsApp's platform.
        </p>

        <p className="mt-3">
          <strong>Website Hosting:</strong> Our hosting provider may process
          technical information necessary to operate and maintain the store.
        </p>

        <p className="mt-3">
          These third-party providers operate under their own applicable
          privacy policies and terms.
        </p>
      </>
    ),
  },
  {
    icon: Lock,
    title: "4. Information Security",
    content: (
      <p>
        We take reasonable technical and organizational measures to protect
        customer information against unauthorized access, alteration,
        disclosure or destruction. However, no method of transmitting or
        storing information online can be guaranteed to be completely secure.
      </p>
    ),
  },
  {
    icon: ShieldCheck,
    title: "5. Sharing of Information",
    content: (
      <>
        <p>
          We do not sell customers' personal information.
        </p>

        <p className="mt-3">
          Information may be shared with service providers when necessary
          to process payments, manage orders, provide delivery services,
          maintain the website or meet applicable legal obligations.
        </p>

        <p className="mt-3">
          We only intend to share information where reasonably necessary
          for these purposes.
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: "6. Data Retention",
    content: (
      <p>
        We retain personal information for as long as reasonably necessary
        to provide our services, manage customer accounts, fulfil orders,
        maintain transaction records, resolve disputes and meet applicable
        legal obligations.
      </p>
    ),
  },
  {
    icon: UserCheck,
    title: "7. Your Privacy Rights",
    content: (
      <>
        <p>
          Subject to applicable data protection laws, you may have the right
          to:
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Request access to your personal information.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of personal information where applicable.</li>
          <li>Object to or request restrictions on certain processing.</li>
          <li>Withdraw consent where processing is based on consent.</li>
        </ul>

        <p className="mt-3">
          Some information may need to be retained where required by law
          or necessary for legitimate business purposes.
        </p>
      </>
    ),
  },
  {
    icon: MessageCircle,
    title: "8. Contact Us About Privacy",
    content: (
      <>
        <p>
          If you have questions about this Privacy Policy or how your
          information is handled, please contact us.
        </p>

        <div className="mt-5 rounded-xl bg-blue-50 p-5">
          <p className="font-semibold text-[#102746]">
            SONAMA WILLS STORE
          </p>

          <p className="mt-3 text-sm">
            Email:{" "}
            <a
              href="mailto:Contact@gmail.com"
              className="font-semibold text-blue-600 hover:underline"
            >
              Contact@gmail.com
            </a>
          </p>

          <p className="mt-2 text-sm">
            Phone: +234 806 840 7634
          </p>

          <Link
            href="/contact"
            className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline"
          >
            Visit our Contact Support page →
          </Link>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={28} className="text-blue-400" />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Your Privacy Matters
          </p>

          <h1 className="text-3xl font-bold sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
            Your trust matters to us. Learn how SONAMA WILLS collects,
            uses, protects and manages your personal information.
          </p>

          <p className="mt-5 text-xs text-gray-400">
            Last Updated: November 7, 2026
          </p>

        </div>

      </section>

      {/* Introduction */}
      <section className="mx-auto max-w-5xl px-5 pt-14 sm:px-8">

        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold text-[#102746]">
            Introduction
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Welcome to SONAMA WILLS STORE. This Privacy Policy explains
            how we collect, use, store and protect information when you
            visit our website, create an account, make a purchase or
            communicate with us.
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            By using our website, you acknowledge that your information
            may be processed as described in this policy and in accordance
            with applicable data protection laws.
          </p>

        </div>

      </section>

      {/* Policy Sections */}
      <section className="mx-auto max-w-5xl space-y-5 px-5 py-12 sm:px-8 sm:py-16">

        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </div>

                <h2 className="text-lg font-bold text-[#102746] sm:text-xl">
                  {section.title}
                </h2>

              </div>

              <div className="mt-5 text-sm leading-7 text-gray-600">
                {section.content}
              </div>

            </article>
          );
        })}

      </section>

      {/* Footer */}
      <footer className="bg-[#0d1d32] px-5 py-8 text-center text-xs text-gray-400">

        <p>© 2026 SONAMA WILLS STORE. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-5">

          <Link href="/contact" className="transition hover:text-white">
            Contact Support
          </Link>

          <Link href="/terms" className="transition hover:text-white">
            Terms & Conditions
          </Link>

          <Link href="/" className="transition hover:text-white">
            Back to Store
          </Link>

        </div>

      </footer>

    </main>
  );
}