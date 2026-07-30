"use client";
import { createPortal } from "react-dom";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { X, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface GifPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

const GIFS = [
  "/gifs/cat.gif",
  "/gifs/abc.gif",
  "/gifs/ed3c6d64f6741606912e58f685634f37.gif",
  "/gifs/599726fcdc2a4a6b931a3f4c3da51ae6.gif",
  "/gifs/41bbda4c12c0d1478a57ec0397c39bb5.gif",
  "/gifs/37539b59856272c928efb5b345a91842.gif",
  "/gifs/3240b08b8c1d722625dfb9e5d73b7b11.gif",
  "/gifs/c7edfd413c043088322916ba487e0ed7.gif",
  "/gifs/237cb5832d9a1da150274b4f8a3540f9.gif",
  "/gifs/bfd76091c13f6a37af6f995b38bd2961.gif",
  "/gifs/1ea1005ac143737e66280713de34204a.gif",
  "/gifs/ad7a6ebe9c7717e5279d84f29171c153.gif",
  "/gifs/631e2c4b5b07e1d3ab37b6b08a3f6fac.gif",
];

export function GifPicker({ isVisible, onClose, onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isVisible) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        const input = document.getElementById("gif-search-input");
        input?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const filteredGifs = searchQuery
    ? GIFS.filter((gif) => gif.toLowerCase().includes(searchQuery.toLowerCase()))
    : GIFS;

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center" onClick={() => onClose()}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          <Search size={16} className="text-white/50 shrink-0" />
          <input
            id="gif-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
          />
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-3 grid grid-cols-3 gap-2">
            {filteredGifs.length === 0 ? (
              <p className="col-span-3 text-center text-white/40 text-sm py-8">
                No GIFs found
              </p>
            ) : (
              filteredGifs.map((gif, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect(gif);
                    onClose();
                  }}
                  className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-200 hover:scale-105 cursor-pointer bg-white/5"
                >
                  <img
                    src={gif}
                    alt="gif"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>,
    document.body,
  );
}
