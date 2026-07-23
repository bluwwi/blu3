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
            Your privacy is important to us. This policy explains what
            information Blu3 collects, how it is used, and your rights.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            1. Information We Collect
          </h2>
          <p>
            <strong>Account Information:</strong> When you sign in with Google
            OAuth, we receive your Google profile name, email address, and
            avatar URL. This is the only personal data we collect.
          </p>
          <p>
            <strong>Service Data:</strong> Rooms you create, tracks you queue,
            playlists you make, and chat messages you send are stored in our
            database to provide the Service.
          </p>
          <p>
            <strong>Local Storage:</strong> Your authentication token is stored
            in your browser&apos;s localStorage to keep you signed in.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            2. What We Do NOT Collect
          </h2>
          <p>
            Blu3 does NOT use cookies, analytics, tracking pixels, or any
            third-party tracking services. We do not collect your IP address,
            device fingerprint, browsing history, or location data. We do not
            sell, rent, or share your personal information with third parties
            for advertising or any other purpose.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            3. How We Use Your Information
          </h2>
          <p>
            Your Google profile info is used solely to identify you within the
            app (display name, avatar) and to associate rooms and playlists with
            your account. Service data (rooms, queues, playlists) is stored to
            provide core functionality and is not used for any other purpose.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            4. Data Storage and Security
          </h2>
          <p>
            Data is stored in PostgreSQL (via Neon) and optionally cached in
            Upstash Redis. We implement reasonable security measures, including
            encrypted connections (HTTPS) and JWT-based authentication. No
            method of electronic storage is 100% secure, but we follow standard
            industry practices to protect your data.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            5. Third-Party Services
          </h2>
          <p>
            This app interfaces with the following third-party services, each
            governed by its own privacy policy:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Google OAuth</strong> — authentication only; governed by
              Google&apos;s Privacy Policy
            </li>
            <li>
              <strong>YouTube iFrame API</strong> — client-side video/audio
              embedding; governed by Google&apos;s Privacy Policy
            </li>
            <li>
              <strong>JioSaavn CDN</strong> — audio streaming from publicly
              accessible endpoints
            </li>
            <li>
              <strong>Neon (PostgreSQL)</strong> — database hosting; governed by
              Neon&apos;s Privacy Policy
            </li>
            <li>
              <strong>Upstash Redis</strong> — caching and rate limiting;
              governed by Upstash&apos;s Privacy Policy
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8">
            6. Data Retention
          </h2>
          <p>
            Your account data is retained until you request deletion. Room data
            (queues, chat history, track history) may be cleaned automatically
            after extended inactivity. You can request deletion of your account
            and associated data by contacting us.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            7. Your Rights
          </h2>
          <p>
            You can request access to, correction of, or deletion of your
            personal data at any time by contacting the developer. Since the
            only personal data stored is your Google profile info, deletion is
            straightforward.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">8. Contact</h2>
          <p>
            Heet Vavadiya —{" "}
            <a
              href="mailto:heetvavadiya099@gmail.com"
              className="underline underline-offset-4 text-white/80 hover:text-white transition-all duration-300"
            >
              heetvavadiya099@gmail.com
            </a>
            <br />
            X:{" "}
            <a
              href="https://x.com/onebluwish"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-white/80 hover:text-white transition-all duration-300"
            >
              @onebluwish
            </a>
          </p>

          <p className="mt-8 text-white/50 text-sm">Last updated: July 2026</p>
        </div>
      </div>
    </div>
  );
}
