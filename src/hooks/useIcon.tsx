"use client";

import React from "react";

/**
 * All available icon names mapped to their filenames in /icons/.
 * Usage: <Icon name="play" size={20} className="text-white" />
 */
const ICON_MAP: Record<string, string> = {
  // Playback
  play: "Play.svg",
  pause: "Pause.svg",
  "skip-next": "Skip-next.svg",
  "skip-forward": "Skip-next.svg",
  "skip-prev": "Skip-prev.svg",
  "skip-back": "Skip-prev.svg",
  stop: "Stop_fill.svg",

  // Audio
  "volume-up": "VolumeUp.svg",
  volume: "VolumeUp.svg",
  "volume-2": "VolumeUp.svg",
  "volume-mute": "sound_mute.svg",
  "volume-x": "sound_mute.svg",
  "sound-fill": "Sound_fill.svg",
  chat: "Chat.svg",
  // Likes / Favorites
  heart: "Heart.svg",
  favorite: "Favorite.svg",

  // UI Actions
  search: "Search.svg",
  plus: "Add_round.svg",
  add: "Add_round.svg",
  trash: "Trash.svg",
  "trash-2": "Trash.svg",
  delete: "Trash.svg",
  edit: "Edit.svg",
  send: "Send.svg",
  share: "Share.svg",
  save: "Save.svg",
  bookmark: "Bookmark.svg",
  import: "Import.svg",
  "archive-import": "Arhive_import.svg",
  basket: "Basket_alt.svg",
  link: "link_alt.svg",
  setting: "setting-2.svg",

  comment: "comment.svg",
  "message-square": "comment.svg",

  // Music
  music: "Music.svg",
  "music-fill": "Music_fill.svg",
  "music-2": "Music.svg",
  "list-music": "Music.svg",
  "disc-3": "Music_fill.svg",

  // Time / Clock
  time: "Time.svg",
  clock: "Time.svg",
  "clock-3": "Time.svg",
  "time-attack": "Time_atack.svg",
  "time-progress": "Time_progress.svg",

  // Modes
  shuffle: "Sort_random.svg",
  "sort-random": "Sort_random.svg",
  repeat: "Refresh_2.svg",
  "repeat-1": "Refresh.svg",
  refresh: "Refresh.svg",
  "refresh-2": "Refresh_2.svg",
  playmusic: "playmusic.svg",
  // Misc
  speed: "Speed_alt.svg",
  desktop: "desktop.svg",
  "log-out": "Share.svg",

  menu: "menuu.svg",
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  title?: string;
}

/**
 * Renders an SVG icon from the custom /icons/ pack using a CSS mask
 * so the icon follows `currentColor`.
 */
export function Icon({
  name,
  size = 24,
  className = "",
  style,
  ...rest
}: IconProps) {
  const filename = ICON_MAP[name.toLowerCase()];

  if (!filename) {
    // Fallback: render a placeholder square if icon is unknown
    return (
      <span
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          ...style,
        }}
        {...rest}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={rest["aria-label"] ?? name}
      className={`icon-inherit-color ${className}`}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        width: size,
        height: size,
        backgroundColor: "currentColor",
        maskImage: `url(/icons/${filename})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(/icons/${filename})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        ...style,
      }}
      {...rest}
    />
  );
}

/**
 * A hook that returns the Icon component for convenience.
 * Usage: const { Icon } = useIcon();
 */
export function useIcon() {
  return { Icon };
}

export default Icon;
