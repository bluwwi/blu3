"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="text-white/60 hover:text-white transition-all duration-300 text-sm mb-8 inline-block"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-white/80 leading-relaxed">
          <p>
            Your privacy is important to us. This policy explains how Blu3
            collects, uses, and protects your information.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide when creating an account, such as
            your email address and display name. We also collect usage data to
            improve the service.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            2. How We Use Your Information
          </h2>
          <p>
            Your information is used to provide and improve Blu3, personalize
            your experience, and communicate with you about the service.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            3. Data Sharing
          </h2>
          <p>
            We do not sell your personal data. We may share data with service
            providers who help operate Blu3, under strict confidentiality
            agreements.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            4. Security
          </h2>
          <p>
            We implement reasonable security measures to protect your data, but
            no method of transmission is 100% secure.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8">
            5. Contact
          </h2>
          <p>
            If you have questions about this policy, reach out to us on X
            @realbluex or Instagram @realblue07.
          </p>
          <p className="mt-8 text-white/50 text-sm">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </div>
  );
}
