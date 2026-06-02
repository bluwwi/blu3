export const CONFIG = {
  DEBOUNCE_SEARCH_MS: 600,
  DEBOUNCE_SUGGEST_MS: 200,
  PROGRESS_INTERVAL_MS: 500,
  HEARTBEAT_INTERVAL_MS: 15000,
  DEFAULT_VOLUME: 100,
  YT_HOST: "https://www.youtube-nocookie.com",
  YT_PLAYER_PARAMS: {
    autoplay: 1,
    controls: 0,
    disablekb: 1,
    enablejsapi: 1,
    fs: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    rel: 0,
    vq: "small" as const,
  },
};
