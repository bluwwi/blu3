"use client";

import React from "react";

const ICON_MAP: Record<string, string> = {
  play: "play.svg",
  pause: "pause.svg",
  "skip-next": "Skip-next.svg",
  "skip-forward": "Skip-next.svg",
  "skip-prev": "Skip-prev.svg",
  "skip-back": "Skip-prev.svg",
  stop: "Stop_fill.svg",

  "volume-up": "VolumeUp.svg",
  volume: "VolumeUp.svg",
  "volume-2": "VolumeUp.svg",
  "volume-mute": "sound_mute.svg",
  "volume-x": "sound_mute.svg",
  "vol-none": "vol-none.svg",
  "vol-mid": "vol-mid.svg",
  "vol-full": "vol-full.svg",
  "sound-fill": "Sound_fill.svg",
  chat: "Chat.svg",
  heart: "heart.svg",
  favorite: "Favorite.svg",

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

  music: "Music.svg",
  "music-fill": "Music_fill.svg",
  "music-2": "Music.svg",
  "list-music": "Music.svg",
  "disc-3": "Music_fill.svg",

  time: "Time.svg",
  clock: "Time.svg",
  "clock-3": "Time.svg",
  "time-attack": "Time_atack.svg",
  "time-progress": "Time_progress.svg",

  shuffle: "Sort_random.svg",
  "sort-random": "Sort_random.svg",
  repeat: "Refresh_2.svg",
  "repeat-1": "Refresh.svg",
  refresh: "Refresh.svg",
  "refresh-2": "Refresh_2.svg",
  playmusic: "playmusic.svg",
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

export function Icon({
  name,
  size = 24,
  className = "",
  style,
  ...rest
}: IconProps) {
  const filename = ICON_MAP[name.toLowerCase()];

  if (!filename) {
    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height: size, ...style }}
        {...rest}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={rest["aria-label"] ?? name}
      className={`icon-inherit-color inline-block align-middle shrink-0 ${className}`}
      style={{
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

export function useIcon() {
  return { Icon };
}

export default Icon;
