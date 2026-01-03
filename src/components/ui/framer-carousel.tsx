"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselItem {
  id: string;
  url: string;
  title: string;
  storagePath?: string;
}

export const items: CarouselItem[] = [
  {
    id: "recado-1",
    url: "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?q=80&w=1200&auto=format&fit=crop",
    title: "Aviso de Expediente",
  },
  {
    id: "recado-2",
    url: "https://images.unsplash.com/photo-1539552678512-4005a33c64db?q=80&w=1200&auto=format&fit=crop",
    title: "Comunicado Interno",
  },
  {
    id: "recado-3",
    url: "https://images.unsplash.com/photo-1709983966747-58c311fa6976?q=80&w=1200&auto=format&fit=crop",
    title: "Recado do Financeiro",
  },
];

interface FramerCarouselProps {
  items?: CarouselItem[];
  autoPlayMs?: number;
}

export function FramerCarousel({ items: itemsProp, autoPlayMs = 8000 }: FramerCarouselProps) {
  const displayItems = itemsProp ? itemsProp.slice(0, 3) : items;
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (!displayItems.length) return;
    if (index > displayItems.length - 1) {
      setIndex(0);
    }
  }, [displayItems.length, index]);

  useEffect(() => {
    if (!displayItems.length || !containerRef.current) return;

    const animateToIndex = () => {
      const containerWidth = containerRef.current?.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    };

    animateToIndex();
    const handleResize = () => animateToIndex();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [displayItems.length, index, x]);

  useEffect(() => {
    if (displayItems.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % displayItems.length);
    }, autoPlayMs);

    return () => window.clearInterval(interval);
  }, [autoPlayMs, displayItems.length]);

  if (!displayItems.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
        Nenhum recado visual cadastrado.
      </div>
    );
  }

  return (
    <div className="lg:p-8 sm:p-4 p-2 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-2xl" ref={containerRef}>
          <motion.div className="flex" style={{ x }}>
            {displayItems.map((item) => (
              <div key={item.id} className="shrink-0 w-full h-[320px] sm:h-[360px] lg:h-[420px]">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-2xl select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

          <motion.button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-white/90 hover:scale-110 hover:opacity-100 opacity-80"
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <motion.button
            type="button"
            disabled={index === displayItems.length - 1}
            onClick={() =>
              setIndex((current) => Math.min(displayItems.length - 1, current + 1))
            }
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === displayItems.length - 1
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-white/90 hover:scale-110 hover:opacity-100 opacity-80"
              }`}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-white/30 rounded-full border border-white/40">
            {displayItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-2 bg-white/60"
                }`}
                aria-label={`Ir para o recado ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
