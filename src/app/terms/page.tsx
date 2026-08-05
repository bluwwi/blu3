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
          <h2 className="text-xl font-semibold text-white mt-8">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Blu3 (the &quot;Service&quot;) at blu3.in, you
            agree to be bound by these Terms of Service. If you do not agree, do
            not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            2. Nature of Service
          </h2>
          <p>
            Blu3 is a non-commercial, student-built demonstration project
            created for educational and portfolio purposes. It provides a
            real-time collaborative music listening experience by interfacing
            with publicly available third-party APIs. The Service is provided
            &quot;as-is&quot; for learning and demonstration only.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            3. No Content Ownership
          </h2>
          <p>
            All music, audio streams, lyrics, album art, and metadata accessible
            through this Service belong to their respective rights holders,
            including but not limited to JioSaavn, YouTube/Google, music
            artists, record labels, and publishers. Blu3 does not host, store,
            redistribute, or claim ownership of any copyrighted content. All
            audio is streamed in real time from third-party sources.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            4. Third-Party Services
          </h2>
          <p>
            This Service interfaces with JioSaavn CDN (unofficial/public
            endpoints), YouTube iFrame API, and ytmusic-api.js (unofficial
            YouTube Music metadata wrapper). Your use of these services is
            subject to their respective terms. Blu3 is not affiliated with,
            endorsed by, or connected to JioSaavn, YouTube, Google, or any music
            label.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            5. Account and Authentication
          </h2>
          <p>
            Certain features (room creation, playlists) require signing in via
            Google OAuth. You are responsible for maintaining the security of
            your Google account. Blu3 does not store passwords. Authentication
            is handled entirely through Google&apos;s OAuth service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            6. Limitation of Liability
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, express or implied.
            The developer (Heet Vavadiya) shall not be liable for any damages,
            losses, or claims arising from your use or inability to use the
            Service, including but not limited to third-party API availability
            issues, audio streaming interruptions, or data loss.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            7. Takedown Policy
          </h2>
          <p>
            If you are a rights holder and believe your intellectual property
            has been used in a way that constitutes infringement, please contact
            the developer at heetvavadiya099@gmail.com or via X @onebluwish.
            Upon receipt of a valid legal notice, blu3.in will be taken down
            immediately. The GitHub repository may remain as a local-only
            educational reference.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            8. Prohibited Use
          </h2>
          <p>
            You agree not to use this Service for any commercial purpose, scrape
            or redistribute audio streams or metadata, bypass authentication or
            rate limits, use the Service for any unlawful purpose, or interfere
            with the operation of the Service or third-party APIs.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">
            9. Changes to Terms
          </h2>
          <p>
            These Terms may be updated at any time without prior notice.
            Continued use after changes constitutes acceptance of the updated
            terms.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8">10. Contact</h2>
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
              href="https://x.com/xbluwie"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-white/80 hover:text-white transition-all duration-300"
            >
              @Bluwi
            </a>
            <br />
            GitHub:{" "}
            <a
              href="https://github.com/xrealblue"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-white/80 hover:text-white transition-all duration-300"
            >
              xrealblue
            </a>
          </p>

          <p className="mt-8 text-white/50 text-sm">Last updated: July 2026</p>
        </div>
      </div>
    </div>
  );
}
