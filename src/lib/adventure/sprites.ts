// Tiny image loader + cache for the Adventure canvas blitter. Deliberately
// separate from <SpriteAnimator> (a DOM/CSS background-position tweener) — the
// overworld draws onto a single <canvas>, so it needs raw HTMLImageElements.

const cache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) {
    if (hit.complete && hit.naturalWidth > 0) return Promise.resolve(hit);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`failed to load image: ${src}`));
    img.src = src;
  });
}
