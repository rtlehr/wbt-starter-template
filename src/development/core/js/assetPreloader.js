// AssetPreloader.js
// Preloads images, audio, and video from a JSON manifest.
// Usage:
//   const loader = new AssetPreloader({ concurrency: 4 });
//   await loader.loadManifest('assets/manifest.json');
//   const result = await loader.preloadAll(({ completed, total, percent }) => {
//     console.log(`Progress: ${percent}%`);
//   });
//   const img = result.images.get('logo'); // HTMLImageElement
//   const click = result.audio.get('click'); // HTMLAudioElement
//   const intro = result.video.get('intro'); // HTMLVideoElement

(function (global) {
  const defaultConcurrency = 4;

  // Utility: requestIdleCallback fallback
  const ric = window.requestIdleCallback || function (cb) { return setTimeout(() => cb({ timeRemaining: () => 10 }), 0); };

  class AssetPreloader {
    constructor(opts = {}) {
      this.concurrency = Math.max(1, opts.concurrency || defaultConcurrency);
      this.crossOrigin = opts.crossOrigin ?? "anonymous";
      this._manifest = null;
      this._abort = new AbortController();
    }

    abort() {
      this._abort.abort();
    }

    async loadManifest(url) {
      const res = await fetch(url, { signal: this._abort.signal, cache: "force-cache" });
      if (!res.ok) throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
      this._manifest = await res.json();
      return this._manifest;
    }

    /**
     * Preload everything in the manifest.
     * @param {(p:{completed:number,total:number,percent:number,item?:any})=>void} onProgress
     * @returns {Promise<{images:Map<string,HTMLImageElement>, audio:Map<string,HTMLAudioElement>, video:Map<string,HTMLVideoElement>}>}
     */
    async preloadAll(onProgress) {
      if (!this._manifest) throw new Error("Manifest not loaded. Call loadManifest() first.");

      const tasks = this._buildTasks(this._manifest);
      const total = tasks.length;
      let completed = 0;

      const images = new Map();
      const audio = new Map();
      const video = new Map();

      const update = (item) => {
        completed++;
        if (typeof onProgress === "function") {
          const percent = Math.round((completed / total) * 100);
          onProgress({ completed, total, percent, item });
        }
      };

      // Concurrency-limited scheduler
      const queue = tasks.slice();
      const workers = Array.from({ length: Math.min(this.concurrency, queue.length) }, () =>
        this._worker(queue, (res) => {
          // Put results into the correct map
          if (!res) return;
          const { type, key, el } = res;
          if (type === "image") images.set(key, el);
          if (type === "audio") audio.set(key, el);
          if (type === "video") video.set(key, el);
          update({ type, key });
        })
      );

      await Promise.all(workers);
      return { images, audio, video };
    }

    _buildTasks(manifest) {
      const tasks = [];
      const add = (type, key, url) => tasks.push({ type, key, url });
      if (manifest.images) {
        for (const [k, url] of Object.entries(manifest.images)) add("image", k, url);
      }
      if (manifest.audio) {
        for (const [k, url] of Object.entries(manifest.audio)) add("audio", k, url);
      }
      if (manifest.video) {
        for (const [k, url] of Object.entries(manifest.video)) add("video", k, url);
      }
      return tasks;
    }

    async _worker(queue, onItemDone) {
      while (queue.length && !this._abort.signal.aborted) {
        // Yield to idle time (be nice to the UI thread)
        await new Promise((r) => ric(() => r()));

        const task = queue.shift();
        if (!task) break;

        try {
          const el = await this._loadTask(task);
          onItemDone({ type: task.type, key: task.key, el });
        } catch (err) {
          console.warn(`Preload failed for ${task.type}:${task.key} -> ${task.url}`, err);
          onItemDone(null); // still mark progression
        }
      }
    }

    async _loadTask(task) {
      const { type, url } = task;

      if (type === "image") {
        return await this._loadImage(url);
      } else if (type === "audio") {
        return await this._loadMedia(url, "audio");
      } else if (type === "video") {
        return await this._loadMedia(url, "video");
      } else {
        throw new Error(`Unknown task type: ${type}`);
      }
    }

    _loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        if (this.crossOrigin) img.crossOrigin = this.crossOrigin;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    }

    /**
     * For audio/video we fetch the file into a Blob so it’s really cached,
     * then create an element with a blob: URL and preload it.
     */
    async _loadMedia(url, kind /* "audio" | "video" */) {
      const res = await fetch(url, { signal: this._abort.signal, cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      let el;
      if (kind === "audio") {
        el = new Audio();
      } else {
        el = document.createElement("video");
        el.muted = true; // safer for autoplay constraints
      }

      el.preload = "auto";
      el.src = objectUrl;

      // We consider it "ready" once metadata is loaded; full buffering may require play/pause later.
      await new Promise((resolve) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          resolve(); // resolve to keep progress moving; element may still be usable
        };
        const cleanup = () => {
          el.removeEventListener("loadedmetadata", onReady);
          el.removeEventListener("canplaythrough", onReady);
          el.removeEventListener("error", onError);
        };

        el.addEventListener("loadedmetadata", onReady, { once: true });
        // Some browsers fire canplaythrough later; use either
        el.addEventListener("canplaythrough", onReady, { once: true });
        el.addEventListener("error", onError, { once: true });

        // Kick the browser to actually start decoding in background
        el.load?.();
      });

      return el;
    }
  }

  // UMD-lite export
  if (typeof module !== "undefined" && module.exports) {
    module.exports = AssetPreloader;
  } else {
    global.AssetPreloader = AssetPreloader;
  }
})(window);

/*
$(async function () {
  const loader = new AssetPreloader({ concurrency: 4 });

  await loader.loadManifest("assets/manifest.json");

  const assets = await loader.preloadAll(({ percent }) => {
    $("#preloadBar").css("width", percent + "%").attr("aria-valuenow", percent);
  });

  // Example: play the click sound later
  $("#button").on("click", () => {
    const click = assets.audio.get("click");
    click.currentTime = 0;
    click.play().catch(() => {// user gesture may be required });
  });
});
*/