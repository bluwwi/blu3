interface DiscordBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function DiscordBanner({ title, description, image, url, avatar, name }: DiscordBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-[360px]">
      {avatar && (
        <div className="flex items-center gap-2 px-0.5 pb-2">
          <img
            src={avatar}
            alt=""
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-[#dbdee1] text-[13px] font-medium">
            {name || "You"}
          </span>
          <span className="text-[#949ba4] text-[13px]">shared a link</span>
        </div>
      )}
      <div className="bg-[#2b2d31] rounded-lg overflow-hidden border-l-4 border-[#5865F2]">
        <div className="flex p-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[#949ba4] text-[10px] uppercase tracking-wide font-medium mb-1">
              {domain}
            </p>
            <h2 className="text-white text-sm font-semibold leading-snug mb-1 line-clamp-2">
              {title}
            </h2>
            <p className="text-[#949ba4] text-[11px] leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
          {image && (
            <img
              src={image}
              alt=""
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
