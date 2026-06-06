interface InstagramHomeBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function InstagramHomeBanner({
  title,
  description,
  image,
  url,
  avatar,
  name,
}: InstagramHomeBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-90 h-50 bg-linear-to-br from-fuchsia-700 via-pink-600 to-orange-500 p-4 relative">
      {avatar && (
        <div className="w-full flex flex-col justify-between h-full">
          <div className=""></div>
          <div className="flex flex-col">
            <span className="text-white text-center text-2xl">
              Music, Fun {"&"} Vibe{"."}
            </span>
          </div>
          <div className="w-full text-sm pr-1.5 text-right">{domain}</div>
          <div className="absolute bottom-4 left-4 justify-end gap-2">
            <img
              src={"/logo/blu3.svg"}
              alt=""
              className="w-12 h-fit p-0.5 object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
