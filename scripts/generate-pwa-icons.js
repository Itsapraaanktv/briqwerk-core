import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '../public');

const svgBuffer = readFileSync(join(publicDir, 'mask-icon.svg'));

// Generate PWA icons
const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(join(publicDir, `pwa-${size}x${size}.png`));
  }

  // Generate apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile(join(publicDir, 'favicon.ico'));
}

generateIcons().catch(console.error); 