import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
// Transparent renders need PNG frames; the alpha codecs are set per-script.
