import React from "react";
import { Composition } from "remotion";
import { VolumeCurve, volumeCurveSchema, volumeCurveDefaults } from "./VolumeCurve";
import { CANVAS } from "./curves";
import { DURATION, FPS } from "./timing";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="VolumeCurve"
    component={VolumeCurve}
    durationInFrames={DURATION}
    fps={FPS}
    width={CANVAS.width}
    height={CANVAS.height}
    schema={volumeCurveSchema}
    defaultProps={volumeCurveDefaults}
  />
);
