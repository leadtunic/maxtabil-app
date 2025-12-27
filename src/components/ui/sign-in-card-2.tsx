import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface SignInCard2Props {
  title: string;
  subtitle?: string;
  logoSrc?: string;
  logoAlt?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  layout?: "full" | "split";
  background?: "dark" | "light";
  header?: ReactNode | null;
}

export function SignInCard2({
  title,
  subtitle,
  logoSrc,
  logoAlt = "Logo",
  children,
  footer,
  className,
  layout = "full",
  background = "dark",
  header,
}: SignInCard2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      mouseX.set(event.clientX - rect.left - rect.width / 2);
      mouseY.set(event.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    node.addEventListener("mousemove", handleMouseMove);
    node.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  const isSplit = layout === "split";
  const isLight = background === "light";

  const headerContent =
    header === null
      ? null
      : header ?? (
          <div className="text-center space-y-1 mb-6 relative">
            {logoSrc ? (
              <div className="mx-auto w-16 h-16 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-white/5">
                <img src={logoSrc} alt={logoAlt} className="w-12 h-12 object-contain" />
              </div>
            ) : (
              <div className="mx-auto w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-lg font-semibold text-white/80">
                {title.slice(0, 1)}
              </div>
            )}
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
          </div>
        );

  return (
    <div
      className={cn(
        isSplit
          ? "h-full w-full relative overflow-hidden flex items-center justify-center p-6"
          : "min-h-screen w-screen relative overflow-hidden flex items-center justify-center p-6",
        isLight ? "bg-white" : "bg-neutral-950",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          isLight
            ? "bg-gradient-to-b from-primary/10 via-white to-white"
            : "bg-gradient-to-b from-primary/30 via-neutral-950 to-neutral-950"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 mix-blend-soft-light",
          isLight ? "opacity-[0.02]" : "opacity-[0.04]"
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />

      <div
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] blur-[80px]",
          isLight ? "bg-primary/12" : "bg-primary/20"
        )}
      />
      <motion.div
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full blur-[60px]",
          isLight ? "bg-primary/12" : "bg-primary/20"
        )}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full blur-[60px]",
          isLight ? "bg-primary/12" : "bg-primary/20"
        )}
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1 }}
      />

      <div
        className={cn(
          "absolute left-1/4 top-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse opacity-40",
          isLight ? "bg-slate-200/70" : "bg-white/5"
        )}
      />
      <div
        className={cn(
          "absolute right-1/4 bottom-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40",
          isLight ? "bg-slate-200/70" : "bg-white/5"
        )}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div className="relative" style={{ rotateX, rotateY }} ref={containerRef}>
          <div className="relative group">
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                ],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror",
              }}
            />

            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                }}
              />
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ top: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  top: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.6,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6,
                  },
                }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ right: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  right: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.2,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2,
                  },
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ bottom: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  bottom: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.8,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8,
                  },
                }}
              />
            </div>

            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.08] shadow-2xl overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
                  backgroundSize: "30px 30px",
                }}
              />

              {headerContent}

              <div className="relative space-y-4">{children}</div>

              {footer && <div className="mt-6 text-xs text-white/50 text-center">{footer}</div>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
