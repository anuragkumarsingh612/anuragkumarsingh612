import sharp from 'sharp';
const source = new URL('../public/favicon.svg', import.meta.url);
for (const size of [192, 512]) {
  await sharp(source.pathname).resize(size, size).png().toFile(new URL(`../public/icons/icon-${size}.png`, import.meta.url).pathname);
}
await sharp(source.pathname).resize(512, 512).flatten({background:'#8ab4ff'}).png().toFile(new URL('../public/icons/maskable-512.png',import.meta.url).pathname);
