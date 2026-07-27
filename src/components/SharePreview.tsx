"use client";

type Platform = "discord" | "twitter" | "instagram" | "whatsapp";
type ShareType = "home" | "room";

interface SharePreviewProps {
  platform: Platform;
  type: ShareType;
  title: string;
  description: string;
  image: string;
  url: string;
  avatar?: string;
  name?: string;
}

const GRADIENTS: Record<Platform, string> = {
  discord: "",
  twitter: "bg-linear-to-b from-sky-700 to-black",
  instagram: "bg-linear-to-br from-fuchsia-700 via-pink-600 to-orange-500",
  whatsapp: "bg-linear-to-b from-emerald-700 to-black",
};

function HomePreview({ platform, url }: { platform: Platform; url: string }) {
  const domain = new URL(url).hostname;

  if (platform === "discord") {
    return (
      <div className="w-90 h-50 relative">
        <img src={`/homebanner.png?v=4`} alt="" className="w-full h-full absolute inset-0 object-cover" />
      </div>
    );
  }

  return (
    <div className={`w-90 h-50 p-4 relative ${GRADIENTS[platform]}`}>
      <div className="w-full flex flex-col justify-between h-full">
        <div />
        <div className="flex flex-col">
          <span className="text-white text-center text-2xl">
            Music, Fun {"&"} Vibe{"."}
          </span>
        </div>
        <div className="w-full text-sm pr-1.5 text-right">{domain}</div>
        <div className="absolute bottom-4 left-4">
          <img src={"/logo/blu3.svg"} alt="" className="w-12 h-fit p-0.5 object-cover" />
        </div>
      </div>
    </div>
  );
}

function RoomPreview({ platform, url, avatar, name }: SharePreviewProps) {
  const domain = new URL(url).hostname;

  if (platform === "discord") {
    return (
      <div className="w-90 h-50 relative">
        <img src={`/banner.png?v=4`} alt="" className="w-full h-full absolute inset-0 object-cover" />
        {avatar && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img src={avatar} alt="" className="w-12 h-12 -ml-28 -mt-3 rounded-full object-cover" />
          </div>
        )}
        <div className="absolute bottom-1 right-2 text-white text-xs">{domain}</div>
      </div>
    );
  }

  return (
    <div className={`w-90 h-50 p-4 relative ${GRADIENTS[platform]}`}>
      {avatar && (
        <div className="w-full flex flex-col justify-between h-full">
          <div className="absolute top-4 right-4">
            <img src={avatar} alt="" className="w-14 h-14 border-2 border-white/70 rounded-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-3xl">
              {name?.split(" ")[0] || "You"}
              {","}
            </span>
            <span className="text-white/70 text-xl">invited you to</span>
            <span className="text-white/70 -mt-1 text-xl">Blu3{".in"}</span>
          </div>
          <div className="w-full text-sm pr-1.5 text-right">{domain}</div>
          <div className="absolute bottom-4 left-4">
            <img src={"/logo/blu3.svg"} alt="" className="w-14 h-fit p-0.5 object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

export function SharePreview(props: SharePreviewProps) {
  return props.type === "home" ? <HomePreview platform={props.platform} url={props.url} /> : <RoomPreview {...props} />;
}
