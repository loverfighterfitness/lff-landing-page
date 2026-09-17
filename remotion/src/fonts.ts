import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Montserrat is self-hosted rather than pulled from Google Fonts so renders work
 * offline and stay byte-identical run to run. One variable file covers 100-900.
 */
export const MONTSERRAT_FAMILY = "Montserrat";

export const montserratReady = loadFont({
  family: MONTSERRAT_FAMILY,
  url: staticFile("fonts/Montserrat-variable.woff2"),
  weight: "100 900",
  format: "woff2",
});
