import React from "react";
import { Composition } from "remotion";
import { VolumeCurve, volumeCurveSchema, defaultsFor } from "./VolumeCurve";
import { CANVAS } from "./curves";
import { DURATION, FPS } from "./timing";
import { PALETTES } from "./palettes";

/**
 * One composition per palette. They share the whole component tree — only the
 * colour defaults differ, and every one of those stays editable in Studio.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {PALETTES.map(p => (
      <Composition
        key={p.id}
        id={`VolumeCurve${p.id}`}
        component={VolumeCurve}
        durationInFrames={DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={volumeCurveSchema}
        defaultProps={defaultsFor(p)}
      />
    ))}
  </>
);
