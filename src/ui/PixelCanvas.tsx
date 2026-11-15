"use client";

import { useEffect, useRef } from "react";

/** A canvas drawn at a small logical size and scaled up with hard pixels. */
export function PixelCanvas({
  width,
  height,
  draw,
  className,
  label,
}: {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
  }, [draw, width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className ? `pixel ${className}` : "pixel"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
