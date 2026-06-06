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

export function SharePopup({ isVisible, roomCode, onClose }: SharePopupProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="w-80 p-4 text-center items-center flex flex-col border border-white/30 bg-black/35 backdrop-blur-sm rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-lg font-semibold mb-5">
          Share Room
        </p>

        <div className="flex justify-center mb-4 border-2 w-fit border-white">
          <QRCode
            value={`${window.location.origin}/room/${roomCode}`}
            size={200}
          />
        </div>

        <p className="text-white/60 text-sm mb-3 truncate px-2">
          {window.location.origin}/room/{roomCode}
        </p>

        <button
          onClick={handleCopyLink}
          className="flex items-center rounded-lg justify-center gap-2 w-full py-1.5 mb-2 text-black text-sm font-semibold transition-all duration-500 cursor-pointer bg-white hover:bg-[#e8e8e8]"
        >
          {copied ? (
            <>
              <Check size={14} /> Copied!
            </>
          ) : (
            <>
              <Copy size={14} /> Copy Link
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="block w-full bg-[#c0392b] hover:bg-[#c0392b]/80  py-1.5 rounded-lg text-white text-[15px] font-semibold transition-all duration-500 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
