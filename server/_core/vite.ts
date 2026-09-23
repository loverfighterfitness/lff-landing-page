import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  // Dynamic imports — only run in dev mode. Use variable paths so esbuild doesn't bundle them.
  const nanoidPkg = "nanoid";
  const vitePkg = "vite";
  const viteConfigPath = path.resolve(__dirname, "../..", "vite.config.ts");
  const { nanoid } = await import(nanoidPkg);
  const { createServer: createViteServer } = await import(vitePkg);
  const viteConfig = (await import(viteConfigPath)).default;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, "../..", "dist", "public")
      : path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(
    express.static(distPath, {
      redirect: false,
      setHeaders(res, filePath) {
        // Hashed build assets never change; media is versioned by filename.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(mp4|jpe?g|png|webp|svg)$/i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=604800");
        }
      },
    })
  );

  // fall through to index.html if the file doesn't exist
  const indexHtml = fs.existsSync(path.resolve(distPath, "index.html"))
    ? fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8")
    : "";
  app.use("*", (req, res) => {
    const meta = ROUTE_META[req.originalUrl.split("?")[0].replace(/\/+$/, "")];
    if (!meta || !indexHtml) {
      res.sendFile(path.resolve(distPath, "index.html"));
      return;
    }
    res.set("Content-Type", "text/html").send(withRouteMeta(indexHtml, meta));
  });
}

type RouteMeta = { title: string; description: string; url: string; image?: string };

// Per-route <head> so shared links (Instagram, iMessage) and Google see the right page,
// not the homepage's coaching copy. Crawlers for link previews don't run JS.
const ROUTE_META: Record<string, RouteMeta> = {
  "/shop": {
    title: "LFF Merch | Tees, Lifting Straps, Wrist Cuffs & Socks",
    description:
      "Official Lover Fighter Fitness merch. Heavyweight drop-shoulder tees, lifting straps, wrist cuffs and crew socks. Limited drops, shipped Australia-wide.",
    url: "https://www.loverfighterfitness.com/shop",
    image: "https://www.loverfighterfitness.com/shop/hero-poster.jpg",
  },
  "/program": {
    title: "The Hypertrophy Meta | Lover Fighter Fitness Training Program",
    description:
      "An upper/lower split run twice a week, every exercise chosen through the four pillars of hypertrophy and progressed every week. Instant PDF download.",
    url: "https://www.loverfighterfitness.com/program",
  },
  "/calculator": {
    title: "Macro Calculator | Lover Fighter Fitness",
    description:
      "Work out your calories and macros for fat loss, maintenance or building muscle. Free calculator from Lover Fighter Fitness.",
    url: "https://www.loverfighterfitness.com/calculator",
  },
};

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function withRouteMeta(html: string, meta: RouteMeta) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta (?:name|property)="(?:og:|twitter:)?title" content=")[^"]*"/g, `$1${title}"`)
    .replace(/(<meta (?:name|property)="(?:og:|twitter:)?description" content=")[^"]*"/g, `$1${description}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${meta.url}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${meta.url}"`)
    .replace(/\s*<link rel="preload" as="image" href="\/hero.jpg"[^>]*>/, "");
  if (meta.image) {
    out = out.replace(/(<meta (?:name|property)="(?:og|twitter):image" content=")[^"]*"/g, `$1${meta.image}"`);
  }
  return out;
}
