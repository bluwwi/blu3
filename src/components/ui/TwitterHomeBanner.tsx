interface TwitterHomeBannerProps {
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

export function TwitterHomeBanner({
  title,
  description,
  image,
  url,
  avatar,
  name,
}: TwitterHomeBannerProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-90 h-50 bg-linear-to-b from-sky-700 to-black p-4 relative">
      {avatar && (
        <div className="w-full flex flex-col justify-between h-full">
          <div className="absolute top-4 right-4 justify-end gap-2">
            <img
              src={avatar}
              alt=""
              className="w-14 h-14 border-2 border-white/70 rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-3xl">
              {name?.split(" ")[0] || "You"}
              {","}
            </span>
            <span className="text-white/70 text-xl">shared</span>
            <span className="text-white/70 -mt-1 text-xl">Blu3{".in"}</span>
          </div>
          <div className="w-full text-sm pr-1.5 text-right">{domain}</div>
          <div className="absolute bottom-4 left-4 justify-end gap-2">
            <img
              src={"/logo/blu3.svg"}
              alt=""
              className="w-14 h-fit p-0.5 object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
