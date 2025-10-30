class SpriteSheet {
  /**
   * @param {Object} opts
   * @param {string}  opts.src            Image URL for the spritesheet
   * @param {number}  opts.frameWidth     Width of a single frame (px)
   * @param {number}  opts.frameHeight    Height of a single frame (px)
   * @param {number}  [opts.frames]       Total frames; if omitted, computed from sheet size
   * @param {number}  [opts.columns]      Frames per row; auto-detected if omitted
   * @param {number}  [opts.fps=12]       Playback frames per second
   * @param {boolean} [opts.loop=true]    Loop playback
   * @param {boolean} [opts.pingPong=false]  Reverse at ends (A→B→A)
   * @param {number}  [opts.startFrame=0] First frame index (inclusive)
   * @param {number}  [opts.endFrame]     Last frame index (inclusive); defaults to frames-1
   * @param {function} [opts.onComplete]  Called when a non-looping run finishes
   * @param {function} [opts.onLoop]      Called when a loop completes
   * @param {"canvas"|"css"} [opts.mode="canvas"]  Render mode
   */
  constructor(opts = {}) {
    // config
    this.src         = opts.src;
    this.frameWidth  = opts.frameWidth;
    this.frameHeight = opts.frameHeight;
    this.fps         = opts.fps ?? 12;
    this.loop        = opts.loop ?? true;
    this.pingPong    = opts.pingPong ?? false;
    this.onComplete  = opts.onComplete || null;
    this.onLoop      = opts.onLoop || null;
    this.mode        = opts.mode || "canvas";

    // runtime
    this._img = new Image();
    this._loaded = false;

    this.totalFrames = opts.frames ?? 0;
    this.columns     = opts.columns ?? 0;

    this.startFrame  = opts.startFrame ?? 0;
    this.endFrame    = (opts.endFrame != null) ? opts.endFrame : null;

    this._current = this.startFrame;
    this._dir = 1; // 1 forward, -1 backward (used for pingPong)
    this._isPlaying = false;

    // timing
    this._acc = 0;
    this._lastTs = 0;
    this._frameDur = 1 / this.fps;

    // targets
    this._canvas = null;
    this._ctx = null;
    this._el = null; // for CSS mode

    // rAF handle
    this._raf = 0;
  }

  /** Load image and prepare dimensions. Returns a Promise that resolves when ready. */
  async init(target) {
    await this._loadImage(this.src);

    // Auto-calc columns/frames if not provided
    this.columns = this.columns || Math.floor(this._img.width / this.frameWidth);
    if (!this.totalFrames) {
      const rows = Math.floor(this._img.height / this.frameHeight);
      this.totalFrames = this.columns * rows;
    }

    this.endFrame = (this.endFrame != null) ? this.endFrame : (this.totalFrames - 1);

    // Bind target
    if (this.mode === "canvas") {
      this._canvas = (target instanceof HTMLCanvasElement) ? target : document.querySelector(target);
      if (!this._canvas) throw new Error("Canvas target not found");
      this._canvas.width = this.frameWidth;
      this._canvas.height = this.frameHeight;
      this._ctx = this._canvas.getContext("2d");
    } else {
      this._el = (target instanceof HTMLElement) ? target : document.querySelector(target);
      if (!this._el) throw new Error("Element target not found for CSS mode");
      Object.assign(this._el.style, {
        width:  this.frameWidth + "px",
        height: this.frameHeight + "px",
        backgroundImage: `url("${this.src}")`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated" // nice for retro sheets
      });
    }

    // First render
    this._renderFrame(this._current);
    return this;
  }

  // -------- Controls --------------------------------------------------------

  play() {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this._lastTs = performance.now();
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  pause() {
    this._isPlaying = false;
    cancelAnimationFrame(this._raf);
  }

  stop() {
    this.pause();
    this._dir = 1;
    this._current = this.startFrame;
    this._renderFrame(this._current);
  }

  gotoFrame(index, { render = true } = {}) {
    this._current = this._clamp(index, this.startFrame, this.endFrame);
    if (render) this._renderFrame(this._current);
  }

  setFPS(fps) {
    this.fps = Math.max(1, fps|0);
    this._frameDur = 1 / this.fps;
  }

  setRange(start, end) {
    this.startFrame = this._clamp(start, 0, this.totalFrames - 1);
    this.endFrame   = this._clamp(end,   0, this.totalFrames - 1);
    if (this.startFrame > this.endFrame) [this.startFrame, this.endFrame] = [this.endFrame, this.startFrame];
    this.gotoFrame(this.startFrame);
  }

  setLoop(loop, pingPong = this.pingPong) {
    this.loop = !!loop;
    this.pingPong = !!pingPong;
  }

  destroy() {
    this.pause();
    this._canvas = this._ctx = this._el = null;
    this._img = null;
  }

  // -------- Internals -------------------------------------------------------

  async _loadImage(src) {
    if (this._loaded && this._img?.src === src) return;
    this._loaded = await new Promise((resolve, reject) => {
      this._img.onload = () => resolve(true);
      this._img.onerror = reject;
      this._img.src = src;
    });
  }

  _tick(ts) {
    if (!this._isPlaying) return;
    const dt = (ts - this._lastTs) / 1000;
    this._lastTs = ts;

    this._acc += dt;
    while (this._acc >= this._frameDur) {
      this._acc -= this._frameDur;
      this._advance();
    }

    this._renderFrame(this._current);
    this._raf = requestAnimationFrame(this._tick);
  }

  _advance() {
    let next = this._current + this._dir;

    // At ends
    const atStart = next < this.startFrame;
    const atEnd   = next > this.endFrame;

    if (this.pingPong) {
      if (atEnd || atStart) {
        this._dir *= -1;
        next = this._current + this._dir;
        if (!this.loop && (this._current === this.startFrame || this._current === this.endFrame)) {
          this.pause();
          this.onComplete && this.onComplete(this);
          return;
        }
        if (this.loop && (this._current === this.startFrame || this._current === this.endFrame)) {
          this.onLoop && this.onLoop(this);
        }
      }
    } else {
      if (atEnd) {
        if (this.loop) {
          next = this.startFrame;
          this.onLoop && this.onLoop(this);
        } else {
          this.pause();
          this.onComplete && this.onComplete(this);
          return;
        }
      } else if (atStart) {
        // Only happens if playing backwards; clamp
        next = this.startFrame;
      }
    }

    this._current = this._clamp(next, this.startFrame, this.endFrame);
  }

  _renderFrame(index) {
    const col = index % this.columns;
    const row = Math.floor(index / this.columns);
    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;

    if (this.mode === "canvas") {
      this._ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
      this._ctx.drawImage(
        this._img,
        sx, sy, this.frameWidth, this.frameHeight,
        0, 0, this.frameWidth, this.frameHeight
      );
    } else {
      // CSS background-position uses negative offsets to show the slice
      const bx = -sx + "px";
      const by = -sy + "px";
      this._el.style.backgroundPosition = `${bx} ${by}`;
    }
  }

  _clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
}
