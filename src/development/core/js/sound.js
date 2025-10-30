class Sound {
    
  constructor(course) {
    this.course = course;
    this.sounds = {};           // name -> HTMLAudioElement
    this.masterVolume = 1;      // 0..1
    this.muted = false;
    this._unlocked = false;
    this._unlockAudioOnUserGesture();
  }

  // ----- Public API -----

  add(name, src, { preload = true, loop = false } = {}) {
    if (this.sounds[name]) return this.sounds[name];
    const a = new Audio(src);
    a.preload = preload ? 'auto' : 'none';
    a.loop = !!loop;
    a.volume = this._effectiveVolume(1);
    // simple event wiring via jQuery
    $(a).on('ended', () => $(document).trigger('audio:end', [name]));
    $(a).on('error', (e) => $(document).trigger('audio:error', [name, e]));
    this.sounds[name] = a;
    return a;
  }

  /**
   * Play a sound that was added by name, OR pass a direct URL.
   * @param {string} nameOrUrl - registered name or a URL
   * @param {Object} opts
   *  - name: when using a URL and you want to cache it under a specific key
   *  - volume: 0..1 (multiplied by master volume)
   *  - loop: boolean
   *  - seek: seconds to start from
   *  - rate: playbackRate
   *  - onStart: function(name, audioEl)
   *  - onEnd: function(name, audioEl)
   * @returns {Promise} resolves on end, rejects on error
   */
  playsound(nameOrUrl, opts = {}) {
    const {
      name = null,
      volume = 1,
      loop = false,
      seek = null,
      rate = 1,
      onStart = null,
      onEnd = null
    } = opts;

    let key = nameOrUrl;
    let a = this.sounds[nameOrUrl];

    // If not registered and a URL was passed, create & optionally store under opts.name or the URL
    if (!a) {
      const src = nameOrUrl;
      const storeKey = name || src;
      a = this.add(storeKey, src, { preload: true, loop });
      key = storeKey;
    }

    // Configure audio
    a.loop = !!loop;
    if (seek != null) { try { a.currentTime = seek; } catch (_) {} }
    try { a.playbackRate = rate; } catch (_) {}
    a.volume = this._effectiveVolume(volume);

    const $a = $(a);
    const dfd = $.Deferred();

    // one-shot end & error handlers for this play
    const onEnded = () => { 
      $a.off('ended._play end._play error._play playing._play');
      onEnd && onEnd(key, a);
      $(document).trigger('audio:end', [key, a]);
      dfd.resolve(key);
    };
    const onError = (e) => {
      $a.off('ended._play end._play error._play playing._play');
      $(document).trigger('audio:error', [key, e]);
      dfd.reject(e);
    };

    $a.one('ended._play', onEnded);
    $a.one('error._play', onError);
    $a.one('playing._play', () => {
      onStart && onStart(key, a);
      $(document).trigger('audio:start', [key, a]);
    });

    // Start playback
    const playPromise = a.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(onError);
    }

    return dfd.promise();
  }

  pause(name) {
    const a = this.sounds[name];
    if (a && !a.paused) a.pause();
  }

  stop(name) {
    const a = this.sounds[name];
    if (a) {
      a.pause();
      try { a.currentTime = 0; } catch (_) {}
    }
  }

  stopAll() {
    $.each(this.sounds, (_, a) => {
      a.pause();
      try { a.currentTime = 0; } catch (_) {}
    });
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, Number(v) || 0));
    $.each(this.sounds, (_, a) => {
      // keep each element's relative volume – here we just rescale by master
      // (If you want per-sound volumes remembered, store them separately.)
      a.volume = this._effectiveVolume(1);
    });
  }

  mute(on = true) {
    this.muted = !!on;
    $.each(this.sounds, (_, a) => { a.muted = this.muted; });
  }

  // ----- Internals -----

  _effectiveVolume(childVolume) {
    if (this.muted) return 0;
    return Math.max(0, Math.min(1, this.masterVolume * (Number(childVolume) || 0)));
  }

  // Unlock audio on first user gesture (iOS/Android policies)
  _unlockAudioOnUserGesture() {
    if (this._unlocked) return;
    const tryUnlock = () => {
      if (this._unlocked) return;
      const a = new Audio();
      // some browsers require play() to be called on a media with src;
      // others accept an empty Audio; both paths are fine—silently catch.
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { a.pause(); this._unlocked = true; })
         .catch(() => { /* ignore; gesture still consumed */ this._unlocked = true; });
      } else {
        this._unlocked = true;
      }
      $(document).off('.audioUnlock');
    };
    $(document).one('click.audioUnlock keydown.audioUnlock touchstart.audioUnlock', tryUnlock);
  }
}
