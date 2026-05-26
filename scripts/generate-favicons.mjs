import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/favicon.svg');
const outDir = resolve(__dirname, '../public');

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'favicon-16.png',      size: 16 },
  { name: 'favicon-32.png',      size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192.png',     size: 192 },
  { name: 'favicon-512.png',     size: 512 },
];

console.log('Generando favicons desde favicon.svg...');

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, name));
  console.log(`✅ ${name} (${size}x${size})`);
}

console.log('\n✅ Todos los favicons generados en /public/');
