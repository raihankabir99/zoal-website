import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

interface ScrollZoomImageProps {
  src: string;
  alt: string;
  className?: string; // Styles applied to the inner img
  containerClassName?: string; // Styles applied to the outer div
  referrerPolicy?: "no-referrer" | "origin" | "unsafe-url";
}

export default function ScrollZoomImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full overflow-hidden relative",
  referrerPolicy
}: ScrollZoomImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position of the container relative to the viewport.
  // "start end" matches when the element's top enters the bottom edge of the viewport.
  // "end start" matches when the element's bottom exits the top edge of the viewport.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Slowly scale from 1.02 (initial entry) up to 1.16 (exit). This creates a very relaxed, high-end lookbook zoom.
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [1.02, 1.16]);

  // Apply a subtle spring physics dampener to filter out rapid scroll jumps, producing slick frame rates.
  const scale = useSpring(scaleRaw, {
    stiffness: 50,
    damping: 25,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className={containerClassName}>
      <motion.img
        src={src}
        alt={alt}
        className={className}
        style={{ scale }}
        referrerPolicy={referrerPolicy}
      />
    </div>
  );
}
