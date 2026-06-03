"use client";
import type { ReactNode, CSSProperties } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ScrollArea({ children, className, style }: ScrollAreaProps) {
  return (
    <OverlayScrollbarsComponent
      className={className}
      style={style}
      options={{
        scrollbars: {
          theme: "os-theme-bl3",
          autoHide: "leave",
          autoHideDelay: 600,
          clickScroll: false,
          dragScroll: true,
        },
      }}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
