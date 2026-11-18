"use client";

import React, { useEffect, useRef, useState } from "react";

export function JarvisCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // References for position animation without React state overhead (60/120fps)
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on fine pointer devices (desktop / trackpad, not touch)
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setMounted(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Instantly position the inner reticle dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      if (rippleRef.current) {
        rippleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0)`;
        rippleRef.current.style.opacity = "1";

        // Trigger shockwave animation
        requestAnimationFrame(() => {
          if (rippleRef.current) {
            rippleRef.current.style.transition = "transform 0.45s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.45s ease-out";
            rippleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(2.8)`;
            rippleRef.current.style.opacity = "0";
          }
        });
      }
    };

    const onMouseUp = () => {
      setIsClicking(false);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    // Detect clickable elements for cursor hover expansion
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = !!target.closest(
        'a, button, input, textarea, select, [role="button"], [role="tab"], .clickable, [data-interactive="true"]'
      );
      setIsHovered(isInteractive);
    };

    // Smooth RAF loop for the follower ring (spring lag effect)
    const animateRing = () => {
      const speed = 0.2; // Smooth follow speed
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * speed;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * speed;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animateRing);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    rafId.current = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Click Shockwave Ripple */}
      <div
        ref={rippleRef}
        className="pointer-events-none absolute left-0 top-0 -ml-4 -mt-4 h-8 w-8 rounded-full border border-primary/60 bg-primary/10"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      />

      {/* Follower Outer Ring */}
      <div
        ref={ringRef}
        className={`pointer-events-none absolute left-0 top-0 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full border transition-[border-color,background-color,width,height,margin] duration-150 ease-out ${
          isHovered
            ? "border-primary/80 bg-primary/10 shadow-[0_0_15px_rgba(0,229,153,0.3)] !h-10 !w-10 !-ml-5 !-mt-5"
            : isClicking
            ? "border-primary/90 bg-primary/20 scale-90"
            : "border-primary/40 bg-transparent"
        }`}
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* Subtle crosshair notches on the ring */}
        <div className="absolute top-0 h-1 w-0.5 bg-primary/60" />
        <div className="absolute bottom-0 h-1 w-0.5 bg-primary/60" />
        <div className="absolute left-0 h-0.5 w-1 bg-primary/60" />
        <div className="absolute right-0 h-0.5 w-1 bg-primary/60" />
      </div>

      {/* Inner Precision Reticle Dot */}
      <div
        ref={dotRef}
        className={`pointer-events-none absolute left-0 top-0 -ml-1 -mt-1 h-2 w-2 rounded-full transition-[background-color,transform] duration-75 ${
          isHovered
            ? "bg-primary scale-125 shadow-[0_0_8px_#00e599]"
            : isClicking
            ? "bg-white scale-75"
            : "bg-primary/90 shadow-[0_0_6px_#00e599]"
        }`}
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      />
    </div>
  );
}
