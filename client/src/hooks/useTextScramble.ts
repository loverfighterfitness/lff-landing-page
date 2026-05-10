/**
 * useTextScramble — Matrix-style character decode effect
 * Characters scramble through random glyphs before resolving to final text
 */
import { useState, useEffect, useRef, useCallback } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";

interface Options {
  /** ms per character to resolve (default 40) */
  speed?: number;
  /** ms before scramble starts (default 0) */
  delay?: number;
  /** scramble cycles per character before settling (default 3) */
  cycles?: number;
}

export function useTextScramble(
  finalText: string,
  trigger: boolean,
  options: Options = {}
) {
  const { speed = 40, delay = 0, cycles = 3 } = options;
  const [display, setDisplay] = useState("");
  const frameRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scramble = useCallback(() => {
    const chars = finalText.split("");
    const totalChars = chars.length;
    let frame = 0;
    const totalFrames = totalChars * cycles + totalChars;

    const tick = () => {
      const output = chars.map((char, i) => {
        if (char === " ") return " ";
        // How many frames until this char settles
        const settleFrame = i * cycles + (cycles + i);
        if (frame >= settleFrame) return char;
        // Still scrambling
        if (frame >= i * cycles) {
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });

      setDisplay(output.join(""));
      frame++;

      if (frame <= totalFrames) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [finalText, cycles]);

  useEffect(() => {
    if (!trigger) {
      setDisplay("");
      return;
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(scramble, delay);
    } else {
      scramble();
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [trigger, scramble, delay]);

  return display;
}
