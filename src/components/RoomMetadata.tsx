"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export function RoomMetadata() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const user = session?.user;
    if (!user) return;

    document.title = `Blu3 x ${user.name}`;

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && user.image) {
      link.href = user.image;
    }
  }, [session]);

  return null;
}
