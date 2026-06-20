"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="text-white/60 hover:text-white transition-all duration-300 text-sm mb-8 inline-block"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="space-y-6 text-white/80 leading-relaxed">
          <p>
            These Terms of Service govern your use of Blu3. By using Blu3, you
            agree to these terms in full.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Blu3, you agree to be bound by these terms. If
            you do not agree, do not use the service.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            2. User Conduct
          </h2>
          <p>
            You agree not to misuse the service, interfere with its operation,
            or violate any applicable laws.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            3. Intellectual Property
          </h2>
          <p>
            All content and trademarks on Blu3 are owned by their respective
            owners and may not be used without permission.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            4. Limitation of Liability
          </h2>
          <p>
            Blu3 is provided &quot;as is&quot; without warranties of any kind.
            We are not liable for any damages arising from your use of the
            service.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            5. Changes to Terms
          </h2>
          <p>
            We reserve the right to update these terms at any time. Continued
            use after changes constitutes acceptance.
          </p>
          <p className="mt-8 text-white/50 text-sm">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </div>
  );
}
