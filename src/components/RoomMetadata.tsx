"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export function RoomMetadata() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const user = session?.user;
    if (!user) return;

    const firstName = user.name?.split(" ")[0]?.toUpperCase() || "You";
    document.title = `Blu3 x ${firstName}`;

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && user.image) {
      link.href = user.image;
    }
  }, [session]);

  return null;
}
