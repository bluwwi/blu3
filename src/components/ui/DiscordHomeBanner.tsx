interface DiscordHomeBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function DiscordHomeBanner({
  title,
  description,
  image,
  url,
  avatar,
  name,
}: DiscordHomeBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-90 h-50 relative">
      <img
        src={`/homebanner.png?v=2`}
        alt=""
        className="w-full h-full absolute inset-0 object-cover"
      />
    </div>
  );
}
