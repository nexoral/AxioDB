import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const guiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(guiRoot, "public");

// Single source asset. PNG stays the only public image: favicon, og:image and
// the PWA manifest icons must remain PNG (WebP is not accepted there).
const OPTIMIZE = ["AXioDB.png"];

for (const file of OPTIMIZE) {
  const src = join(publicDir, file);
  try {
    const { width, height } = await sharp(src).metadata();
    const buffer = await sharp(src)
      .resize(width, height)
      .png({ palette: true, quality: 90, compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    await sharp(buffer).toFile(src);
    console.log(`[png] ${file}  ${((buffer.length / 1024) | 0)} KiB`);
  } catch (err) {
    console.error(`[skip] ${file}: ${err.message}`);
  }
}

console.log("done");