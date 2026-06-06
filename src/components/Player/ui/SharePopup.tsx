"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { QRCode } from "@/components/QRCode";
import { Copy, Check } from "lucide-react";

interface SharePopupProps {
  isVisible: boolean;
  roomCode?: string;
  onClose: () => void;
}

export function SharePopup({
  isVisible,
  roomCode,
  onClose,
}: SharePopupProps) {
  const [copied, setCopied] = useState(false);

  const url = roomCode
    ? `${window.location.origin}/room/${roomCode}`
    : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className="w-[360px] p-5 text-center flex flex-col items-center border border-white/20 bg-black/55 backdrop-blur-3xl rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-lg font-semibold mb-3">
          Share Room
        </p>

        <div className="border-2 border-white rounded-lg p-1 mb-4">
          <QRCode value={url} size={160} />
        </div>

        <div className="w-full flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2 transition-colors cursor-pointer"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#c0392b] hover:bg-[#c0392b]/80 py-1.5 rounded-lg text-white text-[15px] font-semibold transition-all duration-500 cursor-pointer mt-3"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
