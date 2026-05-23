"use client";

interface Props {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  className?: string;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className = "",
}: Props) {
  const displayVolume = isMuted ? 0 : volume;

  const getVolumeIcon = () => {
    if (isMuted || displayVolume === 0) return "🔇";
    if (displayVolume < 50) return "🔉";
    return "🔊";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={onToggleMute}
        className="text-zinc-400 hover:text-white text-sm transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {getVolumeIcon()}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={displayVolume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-16 h-1 accent-green-500 cursor-pointer"
        aria-label="Volume"
      />
    </div>
  );
}
