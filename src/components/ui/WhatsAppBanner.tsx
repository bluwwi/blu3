interface WhatsAppBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
}

export function WhatsAppBanner({ title, description, image, url }: WhatsAppBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-[320px] bg-white text-black rounded-lg overflow-hidden border border-gray-200">
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
          <p className="text-[12px] text-gray-500 leading-snug line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span className="text-[11px] text-gray-400">{domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
