"use client";

import { useState } from "react";
import { DiscordBanner } from "@/components/ui/DiscordBanner";
import { TwitterBanner } from "@/components/ui/TwitterBanner";
import { InstagramBanner } from "@/components/ui/InstagramBanner";
import { WhatsAppBanner } from "@/components/ui/WhatsAppBanner";

type Platform = "discord" | "twitter" | "instagram" | "whatsapp";
type ShareType = "home" | "room";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "discord", label: "Discord" },
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
];

const ROOM_CODE = "BLU3";

function getShareData(type: ShareType) {
  if (type === "room") {
    return {
      title: "Join me on Blu3",
      description: "Listening to music together in real-time",
      image: "/queue/blu3.jpg",
      url: `https://blu3.app/room/${ROOM_CODE}`,
    };
  }
  return {
    title: "Blu3 — Music Rooms",
    description: "Listen to music together in real-time with friends",
    image: "/hero.png",
    url: "https://blu3.app",
  };
}

export default function SocialPage() {
  const [shareType, setShareType] = useState<ShareType>("home");
  const [platform, setPlatform] = useState<Platform>("discord");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const data = getShareData(shareType);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-[#080808] text-white flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Social Preview</h1>
      <p className="text-white/50 text-sm mb-8">
        See how your Blu3 link looks on different platforms
      </p>

      <div className="w-full max-w-lg space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2 block">
              Share Type
            </label>
            <div className="flex gap-4">
              {(["home", "room"] as ShareType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="shareType"
                    checked={shareType === t}
                    onChange={() => setShareType(t)}
                    className="accent-[#5865F2]"
                  />
                  <span className="capitalize text-sm">{t === "home" ? "Home Page" : "Room"}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wide font-medium mb-2 block">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#080808]">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowPreview(true)}
            className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Show Preview
          </button>
        </div>

        {showPreview && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
              Preview
            </p>
            <div className="flex justify-center">
              {platform === "discord" && <DiscordBanner {...data} />}
              {platform === "twitter" && <TwitterBanner {...data} />}
              {platform === "instagram" && <InstagramBanner {...data} />}
              {platform === "whatsapp" && <WhatsAppBanner {...data} />}
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-white/40 mb-1">Share Link</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={data.url}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
