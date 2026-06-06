interface InstagramBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function InstagramBanner({ title, description, image, url, avatar, name }: InstagramBannerProps) {
  return (
    <div className="relative w-[240px] h-[426px] rounded-2xl overflow-hidden">
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f58529]/70 via-[#dd2a7b]/70 to-[#8134af]/70" />
      {avatar && (
        <div className="absolute top-4 left-4 right-4 flex items-center gap-2.5">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]">
            <img
              src={avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2 border-black"
            />
          </div>
          <span className="text-white text-[11px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {name || "youraccount"}
          </span>
        </div>
      )}
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
