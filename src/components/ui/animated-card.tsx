'use client'
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedCard({ children, className }: AnimatedCardProps) {
  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10"
      style={{ perspective: 1500 }}
    >
      <motion.div
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="relative group">
          {/* Card glow effect */}
          <motion.div 
            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(59, 130, 246, 0.1)",
                "0 0 15px 5px rgba(59, 130, 246, 0.15)",
                "0 0 10px 2px rgba(59, 130, 246, 0.1)"
              ],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut", 
              repeatType: "mirror" 
            }}
          />

          {/* Traveling light beam effect */}
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
            {/* Top light beam */}
            <motion.div 
              className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"
              initial={{ filter: "blur(1px)" }}
              animate={{ 
                left: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(0.5px)", "blur(2px)", "blur(0.5px)"]
              }}
              transition={{ 
                left: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror"
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }
              }}
            />
            
            {/* Right light beam */}
            <motion.div 
              className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
              initial={{ filter: "blur(1px)" }}
              animate={{ 
                top: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(0.5px)", "blur(2px)", "blur(0.5px)"]
              }}
              transition={{ 
                top: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 0.6
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.6
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.6
                }
              }}
            />
            
            {/* Bottom light beam */}
            <motion.div 
              className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"
              initial={{ filter: "blur(1px)" }}
              animate={{ 
                right: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(0.5px)", "blur(2px)", "blur(0.5px)"]
              }}
              transition={{ 
                right: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.2
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.2
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.2
                }
              }}
            />
            
            {/* Left light beam */}
            <motion.div 
              className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-70"
              initial={{ filter: "blur(1px)" }}
              animate={{ 
                bottom: ["-50%", "100%"],
                opacity: [0.3, 0.7, 0.3],
                filter: ["blur(0.5px)", "blur(2px)", "blur(0.5px)"]
              }}
              transition={{ 
                bottom: {
                  duration: 2.5, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatDelay: 1,
                  delay: 1.8
                },
                opacity: {
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.8
                },
                filter: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.8
                }
              }}
            />
            
            {/* Corner glow spots */}
            <motion.div 
              className="absolute top-0 left-0 h-[4px] w-[4px] rounded-full bg-blue-400/50 blur-[1px]"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
            />
            <motion.div 
              className="absolute top-0 right-0 h-[6px] w-[6px] rounded-full bg-blue-400/60 blur-[1px]"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 h-[6px] w-[6px] rounded-full bg-blue-400/60 blur-[1px]"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", delay: 1 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 h-[4px] w-[4px] rounded-full bg-blue-400/50 blur-[1px]"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.3, repeat: Infinity, repeatType: "mirror", delay: 1.5 }}
            />
          </div>

          {/* Card border glow on hover */}
          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-blue-500/5 via-blue-400/10 to-blue-500/5 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
          
          {/* Glass card background */}
          <div className={cn(
            "relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden",
            className
          )}>
            {/* Subtle card inner patterns */}
            <div className="absolute inset-0 opacity-[0.02]" 
              style={{
                backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                backgroundSize: '30px 30px'
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
