"use client";
import { createPortal } from "react-dom";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface MembersPopupProps {
  members: Array<{ userId: string; name: string; avatar?: string }>;
  isVisible: boolean;
  onClose: () => void;
  userId?: string;
}

export function MembersPopup({ members, isVisible, onClose, userId }: MembersPopupProps) {
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="w-72 sm:w-96 rounded-3xl border border-white/30 py-3 px-4 bg-black/60 backdrop-blur-sm shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">
            Members({members.length})
          </h2>
        </div>
        <ScrollArea className="max-h-60 ">
          {members.map((m, i) => {
            const isMe = userId === m.userId;
            return (
              <div
                key={i}
                className="flex mt-1 items-center gap-3 rounded-xl"
              >
                <div className="flex items-center rounded-full border-2 border-white/30 shrink-0">
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt=""
                      className="h-10 w-10 aspect-square rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-violet-400/25 flex items-center justify-center text-[9px] text-violet-300 font-semibold">
                      {m.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-white/95 font-medium truncate flex-1">
                    {m.name}
                    {isMe && (
                      <span className="text-xs text-white ml-1">
                        (you)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>,
    document.body,
  );
}
