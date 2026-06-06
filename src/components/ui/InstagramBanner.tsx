interface InstagramBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
}

export function InstagramBanner({ title, description, image, url }: InstagramBannerProps) {
  return (
    <div className="relative w-[240px] h-[426px] rounded-2xl overflow-hidden">
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f58529]/70 via-[#dd2a7b]/70 to-[#8134af]/70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-white">B</span>
        </div>
        <h2 className="text-lg font-bold leading-tight mb-2">{title}</h2>
        <p className="text-xs text-white/80 line-clamp-2">{description}</p>
        <p className="absolute bottom-6 text-[10px] text-white/60">
          blu3.app
        </p>
      </div>
    </div>
  );
}
