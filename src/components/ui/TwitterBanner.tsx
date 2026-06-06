interface TwitterBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
}

export function TwitterBanner({ title, description, image, url }: TwitterBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-[400px] bg-white text-black rounded-xl overflow-hidden border border-gray-200">
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
  );
}
