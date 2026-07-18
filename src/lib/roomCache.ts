interface RoomCacheData {
  queue: any[];
  recentTracks?: any[];
  playback?: any;
  members?: any[];
  lastUpdated: number;
}

const ROOM_CACHE_TTL = 5 * 60 * 1000;

export function cacheRoomData(roomCode: string, data: Partial<RoomCacheData>): void {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "ROOM_CACHE_PUT",
    roomCode,
    data: { ...data, lastUpdated: Date.now() },
  });
}

export function clearRoomCache(roomCode: string): void {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "ROOM_CACHE_DELETE",
    roomCode,
  });
}

export function getCachedRoomData(roomCode: string): Promise<RoomCacheData | null> {
  return new Promise((resolve) => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.onmessage = null;
      resolve(null);
    }, 1000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      const { type, roomCode: rc, data } = event.data ?? {};
      if (type === "ROOM_CACHE_RESULT" && rc === roomCode) {
        if (data && Date.now() - data.lastUpdated < ROOM_CACHE_TTL) {
          resolve(data);
        } else {
          resolve(null);
        }
      }
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "ROOM_CACHE_GET", roomCode },
      [channel.port2],
    );
  });
}
