export function VideoBackground({ url }: { url?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "blur(50px) brightness(0.7) saturate(2.75)",
          transform: "scale(1.35)",
          transformOrigin: "center center",
        }}
      >
        <source src={url ? url : "/music.mp4"} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-linear-to-b from-black/35 via-black/90 to-black/35" />
    </div>
  );
}
