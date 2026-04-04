/**
 * AnimatedLogo — SVG draw-on reveal for the LFF lff lettermark
 * Each letter is revealed top-to-bottom in sequence via clip-path animation
 */
import { motion } from "framer-motion";

const LETTER_PATHS = {
  l: "M 79.640625 6.125 C 148.78125 6.125 211.792969 -63.011719 246.800781 -149.65625 L 238.050781 -154.03125 C 187.289062 -87.519531 126.902344 -49.886719 144.40625 -117.273438 L 287.933594 -653.761719 L 136.527344 -635.382812 L 136.527344 -632.757812 C 137.402344 -620.503906 139.152344 -560.117188 123.402344 -500.605469 L 18.378906 -109.398438 C 0 -46.382812 16.628906 6.125 79.640625 6.125 Z",
  f1: "M -122.0625 162.75 C 7.792969 167.945312 119.464844 100.421875 165.347656 -70.988281 L 253.648438 -398.21875 L 380.90625 -398.21875 L 391.292969 -436.308594 L 264.035156 -436.308594 L 270.097656 -460.550781 C 291.738281 -538.460938 309.054688 -603.390625 351.472656 -603.390625 C 386.101562 -603.390625 410.339844 -547.121094 432.847656 -502.96875 L 437.175781 -502.96875 L 466.609375 -612.046875 C 427.652344 -627.628906 391.292969 -638.015625 348.875 -638.015625 C 268.367188 -638.015625 183.527344 -599.0625 148.035156 -465.742188 L 140.242188 -436.308594 L 72.71875 -436.308594 L 62.328125 -398.21875 L 129.855469 -398.21875 L 42.417969 -70.988281 C 9.523438 50.210938 -36.359375 112.539062 -122.0625 162.75 Z",
  f2: "M -122.0625 162.75 C 7.792969 167.945312 119.464844 100.421875 165.347656 -70.988281 L 253.648438 -398.21875 L 380.90625 -398.21875 L 391.292969 -436.308594 L 264.035156 -436.308594 L 270.097656 -460.550781 C 291.738281 -538.460938 309.054688 -603.390625 351.472656 -603.390625 C 386.101562 -603.390625 410.339844 -547.121094 432.847656 -502.96875 L 437.175781 -502.96875 L 466.609375 -612.046875 C 427.652344 -627.628906 391.292969 -638.015625 348.875 -638.015625 C 268.367188 -638.015625 183.527344 -599.0625 148.035156 -465.742188 L 140.242188 -436.308594 L 72.71875 -436.308594 L 62.328125 -398.21875 L 129.855469 -398.21875 L 42.417969 -70.988281 C 9.523438 50.210938 -36.359375 112.539062 -122.0625 162.75 Z",
};

// Clip rect that expands from top to bottom
function ClipReveal({ id, delay, height = 1000 }: { id: string; delay: number; height?: number }) {
  return (
    <clipPath id={id}>
      <motion.rect
        x="-200"
        width="1000"
        initial={{ y: -height, height: 0 }}
        animate={{ y: -height, height: height * 2 }}
        transition={{ duration: 1.1, delay, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </clipPath>
  );
}

interface AnimatedLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedLogo({ className, style }: AnimatedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1299 1299"
      className={className}
      style={style}
      aria-label="Lover Fighter Fitness"
    >
      <defs>
        <ClipReveal id="clip-l"  delay={0.1} height={1000} />
        <ClipReveal id="clip-f1" delay={0.5} height={1000} />
        <ClipReveal id="clip-f2" delay={0.9} height={1000} />
      </defs>

      {/* Letter: l */}
      <g clipPath="url(#clip-l)">
        <g fill="#eae6d2" transform="translate(292.389555, 933.954657)">
          <path d={LETTER_PATHS.l} />
        </g>
      </g>

      {/* Letter: f (first) */}
      <g clipPath="url(#clip-f1)">
        <g fill="#eae6d2" transform="translate(488.129927, 866.904017)">
          <path d={LETTER_PATHS.f1} />
        </g>
      </g>

      {/* Letter: f (second) */}
      <g clipPath="url(#clip-f2)">
        <g fill="#eae6d2" transform="translate(693.263117, 866.904017)">
          <path d={LETTER_PATHS.f2} />
        </g>
      </g>
    </svg>
  );
}
