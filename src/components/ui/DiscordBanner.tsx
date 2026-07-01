interface DiscordBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function DiscordBanner({ url, avatar, name }: DiscordBannerProps) {
  const domain = new URL(url).hostname;
  return (
    <div className="w-90 h-50 relative">
      <img
        src={"/banner.png"}
        alt=""
        className="w-full h-full absolute inset-0 object-cover"
      />

      {avatar && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img
            src={avatar}
            alt=""
            className="w-12 h-12 -ml-28 -mt-3 rounded-full object-cover"
          />
        </div>
      )}

      <div className="absolute bottom-1 right-2 text-white text-xs">
        {domain}
      </div>
    </div>
  );
}
