import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from "react";

interface Props {
  handleJoin: (code: string) => void;
}

export default function JoinCodeInput({ handleJoin }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (showInput) {
      inputRefs.current[0]?.focus();
    }
  }, [showInput]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^[a-zA-Z0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "Enter") {
      handleJoin(code.join(""));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
      .split("");

    const newCode = [...code];
    pastedData.forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });

    setCode(newCode);

    const nextEmptyIndex = newCode.findIndex((c) => c === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const isComplete = code.every((char) => char !== "");

  useEffect(() => {
    if (isComplete) {
      handleJoin(code.join(""));
    }
  }, [isComplete]);

  if (!showInput) {
    return (
      <div className="fixed bottom-0 right-0 flex justify-center pb-8 pointer-events-none z-20">
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowInput(true)}
            className="px-8 py-3 text-xs font-bold rounded-lg tracking-widest uppercase bg-blue-100 text-black hover:bg-blue-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-20">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-3 border border-white/[0.08] rounded-2xl overflow-hidden px-4 py-3 bg-white/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
          <div className="flex gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-white/40 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                aria-label={`Character ${index + 1} of 6`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
