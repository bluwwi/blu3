interface WhatsAppBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function WhatsAppBanner({ title, description, image, url, avatar, name }: WhatsAppBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-[320px]">
      {avatar && (
        <div className="flex items-center gap-2 pb-2.5">
          <img
            src={avatar}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="text-[#e9edef] text-[12.5px] font-medium">
            {name || "You"}
          </span>
        </div>
      )}
      <div className="bg-[#202c33] text-white rounded-lg overflow-hidden">
        <div className="flex">
          {image && (
            <img
              src={image}
              alt=""
              className="w-24 h-24 object-cover shrink-0"
            />
          )}
          <div className="flex-1 p-3 min-w-0 space-y-1">
            <h2 className="text-[14px] font-semibold leading-snug line-clamp-2">
              {title}
            </h2>
            <p className="text-[12px] text-[#8696a0] leading-snug line-clamp-2">
              {description}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-[#25D366]" />
              <span className="text-[11px] text-[#8696a0]">{domain}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
