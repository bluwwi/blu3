"use client";
import { type ElementType, type ReactNode, type CSSProperties } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";

interface ScrollAreaProps<T extends ElementType = "div"> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  element?: T;
}

export function ScrollArea<T extends ElementType = "div">({
  children,
  className,
  style,
  element,
}: ScrollAreaProps<T>) {
  return (
    <OverlayScrollbarsComponent
      element={element}
      className={className}
      style={style}
      options={{
        scrollbars: {
          theme: "os-theme-bl3",
          autoHide: "scroll",
          autoHideDelay: 600,
          clickScroll: false,
          dragScroll: true,
        },
      }}
      defer
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
