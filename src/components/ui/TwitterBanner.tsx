interface TwitterBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function TwitterBanner({ title, description, image, url, avatar, name }: TwitterBannerProps) {
  const domain = new URL(url).hostname;
  const handle = name
    ? "@" + name.toLowerCase().replace(/\s+/g, "_")
    : "@user";

  return (
    <div className="w-[400px]">
      {avatar && (
        <div className="flex items-center gap-2.5 pb-3">
          <img
            src={avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-black leading-tight truncate">
              {name || "You"}
            </p>
            <p className="text-[13px] text-[#536471] leading-tight truncate">
              {handle}
            </p>
          </div>
        </div>
      )}
      <div className="bg-white text-black rounded-xl overflow-hidden border border-gray-200">
        {image && (
          <img src={image} alt="" className="w-full h-52 object-cover" />
        )}
        <div className="p-3 space-y-1">
          <p className="text-[#536471] text-[11px]">{domain}</p>
          <h2 className="text-[15px] font-semibold leading-snug line-clamp-2">
            {title}
          </h2>
          <p className="text-[#536471] text-[13px] leading-snug line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
