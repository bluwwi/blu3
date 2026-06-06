"use client";
import { createPortal } from "react-dom";

interface LeavePopupProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeavePopup({ isVisible, onConfirm, onCancel }: LeavePopupProps) {
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={onCancel}
    >
      <div
        className="w-80 p-4 text-center border border-white/30 bg-black/35 backdrop-blur-sm rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-xl font-semibold leading-snug py-6">
          Are you sure you want to
          <br />
          leave this Room?
        </p>

        <button
          onClick={onConfirm}
          className="block w-full cursor-pointer py-1.5 mb-2 text-white text-[15px] font-semibold transition-all duration-500 bg-[#c0392b] rounded-xl hover:bg-[#a93226]"
        >
          Yes, leave room
        </button>

        <button
          onClick={onCancel}
          className="block w-full py-1.5 cursor-pointer text-[#1a1a1a] text-[15px] font-medium transition-all duration-500 bg-white rounded-xl hover:bg-[#e8e8e8]"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
