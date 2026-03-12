/**
 * @file Promise-based image asset loader.
 *
 * Replaces the legacy callback-chain (`fwAddImageToLoad` → `onImageLoad`)
 * with a clean async API.  Each image is loaded in parallel via
 * `Promise.all`, and the caller receives a `Map<string, HTMLImageElement>`
 * keyed by the source URL once every asset is ready.
 */

/**
 * @typedef {Object} AssetEntry
 * @property {string} name - A friendly key used to retrieve the image later.
 * @property {string} src  - The URL / path of the image file.
 */

export default class AssetLoader {
  /** @type {Map<string, HTMLImageElement>} Loaded images keyed by name. */
  #assets = new Map();

  /**
   * Load a single image and resolve when it is ready.
   *
   * @param {string} src - Image URL.
   * @returns {Promise<HTMLImageElement>}
   */
  #loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = '';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = `img/${src}`;
    });
  }

  /**
   * Load all listed assets in parallel.
   *
   * @param {AssetEntry[]} entries - Array of `{ name, src }` descriptors.
   * @returns {Promise<Map<string, HTMLImageElement>>} Resolves with the
   *   complete asset map once every image has loaded.
   *
   * @example
   * const loader = new AssetLoader();
   * const assets = await loader.loadAll([
   *   { name: 'title',  src: 'title_screen.png' },
   *   { name: 'game',   src: 'game_screen.png' },
   * ]);
   * ctx.drawImage(assets.get('title'), 0, 0);
   */
  async loadAll(entries) {
    const promises = entries.map(async ({ name, src }) => {
      const img = await this.#loadImage(src);
      this.#assets.set(name, img);
    });
    await Promise.all(promises);
    return this.#assets;
  }

  /**
   * Retrieve a previously loaded image by its name key.
   *
   * @param {string} name - The key supplied in the original `AssetEntry`.
   * @returns {HTMLImageElement}
   */
  get(name) {
    return this.#assets.get(name);
  }
}

