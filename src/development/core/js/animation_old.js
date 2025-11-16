class Animation_old {

  constructor(course, pageInfo) {
    this.course = course;

    // ACCESSIBILITY: detect prefers-reduced-motion once
    this.reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    console.log("Animation Initialized");

    // Safety net: cancel animations when page is hidden/unloaded
    window.addEventListener('pagehide', () => {
      $('.animateMe').each((_, node) => this._cancelAnim($(node)));
    });
  }

  // --- Helpers (A11y + utils) ---------------------------------------------
  _focusableSelector() {
    return [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]',
      '[tabindex]'
    ].join(',');
  }

  // Mark/unmark aria-hidden and manage tabindex on the element & descendants
  _setHiddenForA11y($el, hidden) {
    if (hidden) {
      // store original tabindex on self (if any)
      if (!$el.data('_prevTabindex')) {
        const prev = $el.attr('tabindex');
        if (prev != null) $el.data('_prevTabindex', prev);
      }
      $el.attr('aria-hidden', 'true').attr('tabindex', '-1');

      // store/disable descendants
      $el.find(this._focusableSelector()).each(function () {
        const $c = $(this);
        if (!$c.data('_prevTabindex')) {
          const prev = $c.attr('tabindex');
          if (prev != null) $c.data('_prevTabindex', prev);
        }
        $c.attr('tabindex', '-1');
      });
    } else {
      $el.removeAttr('aria-hidden');

      // restore self tabindex if we had one; otherwise remove
      const prev = $el.data('_prevTabindex');
      if (prev != null) {
        $el.attr('tabindex', String(prev));
      } else {
        $el.removeAttr('tabindex');
      }
      $el.removeData('_prevTabindex');

      // restore descendants
      $el.find(this._focusableSelector()).each(function () {
        const $c = $(this);
        const p = $c.data('_prevTabindex');
        if (p != null) {
          $c.attr('tabindex', String(p));
        } else {
          $c.removeAttr('tabindex');
        }
        $c.removeData('_prevTabindex');
      });
    }
  }
  // -------------------------------------------------------------------------

  setUpAnimation() {

    if (typeof mqPhone !== 'undefined' && mqPhone.matches) {
      return;
    }

    const self = this;

    $(".animateMe").each(function () {
      const $el = $(this);

      // Reset per-element animation index on setup
      $el.data('_animIndex', 0);
      $el.attr('data-currentIndex', '0');

      // Read pane for geometry
      const paneSel = $el.attr("data-animationPane") || "#courseWindow";
      const $pane = $(paneSel);

      const eWidth = $el.outerWidth() || 0;
      const eHeight = $el.outerHeight() || 0;
      const eTop = $el.offset().top;
      const eLeft = $el.offset().left;

      const wHeight = $pane.height() || 0;
      const wWidth = $pane.width() || 0;
      const wTop = $pane.offset().top;
      const wLeft = $pane.offset().left;

      const anchor = self._readAnchor($el);
      $el.css('transform-origin', anchor);

      // Read JSON configs
      const configs = self.parseAnimationJSONList($el);
      if (!configs.length) {
        console.warn('Animation: no valid data-animation for', $el[0]);
        return;
      }

      // TYPEWRITER prep: if any step uses style "typewriter"
      const hasTypewriterStyle = configs.some(c => {
        const styleStr = String(c.style || '').toLowerCase();
        const tokens = styleStr.split(/\s+/).filter(Boolean);
        return tokens.includes('typewriter');
      });
      if (hasTypewriterStyle) {
        const full = $el.text();
        $el
          .attr('aria-label', full)
          .attr('aria-live', 'off')
          .empty()
          .append('<span class="tw-txt" aria-hidden="true"></span>')
          .attr('data-tw-full', full);
      }

      // If FIRST step has fadeIn, start fully transparent
      const firstCfg = configs[0] || {};
      const firstStyleStr = String(firstCfg.style || '').toLowerCase();
      const firstStyles = firstStyleStr.split(/\s+/).filter(Boolean);
      if (firstStyles.includes('fadein')) {
        $el.css('opacity', 0);
      }

      // Normalize configs: slides + zoom (no fade handling here)
      const normConfigs = configs.map(raw => {
        const cfg = Object.assign({}, raw); // shallow copy
        const styleStr = String(cfg.style || '').toLowerCase();
        const styles = styleStr.split(/\s+/).filter(Boolean);

        if (!styles.length) {
          console.warn('Animation step has no style for', $el[0]);
        }

        let newTop = 0;
        let newLeft = 0;
        let goToTop = (cfg.top != null) ? cfg.top : 0;
        let goToLeft = (cfg.left != null) ? cfg.left : 0;

        // --- slide-in from container edges --------------------------------
        if (styles.includes('slideinbottom')) {
          newTop = (wHeight - (eTop - wTop));
        }
        if (styles.includes('slideinright')) {
          newLeft = (wWidth - (eLeft - wLeft));
        }
        if (styles.includes('slideintop')) {
          newTop = 0 - ((eTop - wTop) + eHeight);
        }
        if (styles.includes('slideinleft')) {
          newLeft = 0 - ((eLeft - wLeft) + eWidth);
        }

        // --- slide within pane --------------------------------------------
        if (styles.includes('slideright')) {
          goToLeft = wWidth - eWidth;
        }
        if (styles.includes('slideleft')) {
          goToLeft = 0 - (wWidth - eWidth);
        }
        if (styles.includes('slidebottom')) {
          goToTop = wHeight - eHeight;
        }
        if (styles.includes('slidetop')) {
          goToTop = 0 - (wHeight - eHeight);
        }

        // NOTE: slideOut* handled at play time based on current transform

        // Position element if needed for slideIn* and slide* cases
        if (newTop !== 0) {
          $el.css("top", newTop);
          if (newTop < 0) {
            goToTop = Math.abs(newTop);
          } else {
            goToTop = 0 - newTop;
          }
        }
        if (newLeft !== 0) {
          $el.css("left", newLeft);
          if (newLeft < 0) {
            goToLeft = Math.abs(newLeft);
          } else {
            goToLeft = 0 - newLeft;
          }
        }

        // Defaults if not explicitly provided
        if (cfg.left == null) cfg.left = goToLeft;
        if (cfg.top == null) cfg.top = goToTop;

        cfg.duration = (cfg.duration != null) ? cfg.duration : 1;
        cfg.delay = (cfg.delay != null) ? cfg.delay : 0;

        // Zoom support: use "zoom" style or explicit cfg.scale
        if (styles.includes('zoom') || cfg.scale != null) {
          const s = Number(cfg.scale != null ? cfg.scale : 1);
          cfg.scale = Number.isFinite(s) ? s : 1;
          if (!cfg.anchor) cfg.anchor = anchor;
        } else if (!cfg.anchor) {
          cfg.anchor = anchor;
        }

        // NOTE: we do NOT set cfg.opacity here; fades handled at play
        return cfg;
      });

      $el.attr('data-animation', JSON.stringify(normConfigs));
      $el.css("visibility", "visible");
    });
  }

  // -------------------------------------------------------------------------
  // Main play method: target (selector or jQuery), optional step index
  // -------------------------------------------------------------------------
  playAnimation(target, index) {

    if (typeof mqPhone !== 'undefined' && mqPhone.matches) {
      return;
    }

    const $el = (typeof target === 'string') ? $(target).first() : $(target);
    if (!$el || !$el.length) return;

    const cfgList = this.parseAnimationJSONList($el);
    if (!cfgList.length) {
      console.warn('playAnimation: no data-animation for', $el[0]);
      return;
    }

    // --- Per-element index tracking (with looping) -----------------------
    const len = cfgList.length;

    let stepIndex;
    if (typeof index === 'number' && !Number.isNaN(index)) {
      // Explicit index override (clamped)
      stepIndex = Math.max(0, Math.min(index, len - 1));
    } else {
      // Auto-advance index per element, looping
      let prev = $el.data('_animIndex');
      if (!Number.isInteger(prev) || prev < 0 || prev >= len) {
        prev = 0;
      }
      stepIndex = prev;
    }

    // LOOP: 0 → 1 → … → len-1 → 0 → …
    const nextIndex = (stepIndex + 1) % len;
    $el.data('_animIndex', nextIndex);
    $el.attr('data-currentIndex', String(nextIndex));

    const cfg = cfgList[stepIndex];
    const styleStr = String(cfg.style || '').toLowerCase();
    const styles = styleStr.split(/\s+/).filter(Boolean);

    // Base transform target values (may be changed for slideOut*)
    let left = Number(cfg.left || 0);
    let top = Number(cfg.top || 0);

    // Fades: compute target opacity from cfg + style tokens
    let targetOpacity = (cfg.opacity == null) ? null : Number(cfg.opacity);

    const hasFadeIn = styles.includes('fadein');
    const hasFadeOut = styles.includes('fadeout');

    // fadeIn: ensure final opacity > 0, start from 0
    if (hasFadeIn) {
      if (targetOpacity == null) targetOpacity = 1;
      $el.css('opacity', 0);
    }

    // fadeOut: final opacity 0 if not explicitly overridden
    if (hasFadeOut && targetOpacity == null) {
      targetOpacity = 0;
    }

    const duration = Number(cfg.duration || 0.6);
    const delay = Number(cfg.delay || 0);
    const easing = cfg.easing || 'linear';

    // Typewriter?
    const isTypewriter = styles.includes('typewriter');

    // Zoom parameters
    const hasZoom = (cfg.scale != null);
    const scaleTarget = hasZoom ? Number(cfg.scale) : 1;
    const transformOrigin = cfg.anchor || this._readAnchor($el);
    $el.css('transform-origin', transformOrigin);

    // Callbacks & chaining
    const startFn = this._resolveFn(cfg.startFunction);
    const endFn = this._resolveFn(cfg.endFunction);
    const chain = cfg.chain || null;

    // Sounds
    const beginSound = cfg.beginSound;
    const endSound = cfg.endSound;

    // ACCESSIBILITY: if we’re going to show (opacity > 0), make visible & focusable
    if (targetOpacity == null || targetOpacity > 0) {
      $el.css('visibility', 'visible');
      this._setHiddenForA11y($el, false);
    }

    // mark this run as the active animation instance for this element
    const startToken = this._markAnimStart($el);

    // Begin sound
    if (beginSound != null &&
      this.course &&
      typeof this.course.playSound === 'function') {
      try { this.course.playSound(beginSound); } catch (e) { }
    }

    // Respect reduce motion: jump to end state, still honor callbacks/chain
    if (this.reduceMotion) {
      if (typeof startFn === 'function') startFn($el[0]);

      // For typewriter: instantly reveal full text
      if (isTypewriter) {
        const span = $el.find('.tw-txt');
        const full = $el.attr('data-tw-full') || '';
        if (span.length) span.text(full);
        else $el.text(full);
      }

      const transformFinal = this._composeTransform(left, top, scaleTarget);
      $el.css('transform-origin', transformOrigin);
      $el.css('transform', transformFinal);
      if (targetOpacity != null) $el.css('opacity', String(targetOpacity));

      if (targetOpacity === 0) {
        $el.css('visibility', 'hidden');
        this._setHiddenForA11y($el, true);
      }

      const stillValid = this._shouldStillPlay($el, startToken);

      if (typeof endFn === 'function') endFn($el[0]);

      if (stillValid &&
        endSound != null &&
        this.course &&
        typeof this.course.playSound === 'function') {
        try {
          if (beginSound != null &&
            this.course &&
            typeof this.course.stopSound === 'function') {
            this.course.stopSound(beginSound);
          }
        } catch (e) { }
        try { this.course.playSound(endSound); } catch (e) { }
      }

      if (stillValid && chain) {
        this.playAnimation(chain);
      }

      this._cancelAnim($el);
      return;
    }

    // ------- TYPEWRITER BRANCH -----------------------------------------
    if (isTypewriter) {
      if (typeof startFn === 'function') startFn($el[0]);

      // Optional opacity tween in parallel (no transform for typewriter)
      if (targetOpacity != null) {
        $el.css({
          transitionProperty: 'opacity',
          transitionDuration: duration + 's',
          transitionTimingFunction: easing,
          transitionDelay: delay + 's',
          willChange: 'opacity'
        });
        // Force reflow then apply target opacity
        void $el[0].offsetWidth;
        $el.css('opacity', String(targetOpacity));
      }

      const cps = (cfg.cps != null) ? Number(cfg.cps) : null;

      this._runTypewriter($el, { duration, delay, cps }).then(() => {
        $el.css({
          transitionProperty: '',
          transitionDuration: '',
          transitionTimingFunction: '',
          transitionDelay: '',
          willChange: ''
        });

        if (targetOpacity === 0) {
          $el.css('visibility', 'hidden');
          this._setHiddenForA11y($el, true);
        }

        const stillValid = this._shouldStillPlay($el, startToken);

        if (typeof endFn === 'function') endFn($el[0]);

        if (stillValid &&
          endSound != null &&
          this.course &&
          typeof this.course.playSound === 'function') {
          try {
            if (beginSound != null &&
              this.course &&
              typeof this.course.stopSound === 'function') {
              this.course.stopSound(beginSound);
            }
          } catch (e) { }
          try { this.course.playSound(endSound); } catch (e) { }
        }

        if (stillValid && chain) {
          this.playAnimation(chain);
        }

        this._cancelAnim($el);
      });

      return; // IMPORTANT: skip transform-based flow below
    }
    // -------------------------------------------------------------------

    // NON-TYPEWRITER BRANCH

    // Get current transform (translate + scale)
    const cur = this._getCurrentTransformParts($el); // {x,y,scaleX,scaleY}
    let tx = left;
    let ty = top;

    // ---- slideOut* from current position straight off-screen -----------
    if (
      styles.includes('slideoutleft') ||
      styles.includes('slideoutright') ||
      styles.includes('slideouttop') ||
      styles.includes('slideoutbottom')
    ) {
      const paneSel = $el.attr("data-animationPane") || "#courseWindow";
      const $pane = $(paneSel);
      const paneW = $pane.width() || 0;
      const paneH = $pane.height() || 0;
      const eW = $el.outerWidth() || 0;
      const eH = $el.outerHeight() || 0;

      if (styles.includes('slideoutleft')) {
        tx = cur.x - (paneW + eW);
        ty = cur.y;
      }
      if (styles.includes('slideoutright')) {
        tx = cur.x + (paneW + eW);
        ty = cur.y;
      }
      if (styles.includes('slideouttop')) {
        tx = cur.x;
        ty = cur.y - (paneH + eH);
      }
      if (styles.includes('slideoutbottom')) {
        tx = cur.x;
        ty = cur.y + (paneH + eH);
      }
    }

    // 1) Set transform-origin and starting opacity for fadeIn
    $el.css('transform-origin', transformOrigin);
    if (hasFadeIn && targetOpacity != null) {
      $el.css('opacity', 0);
    }

    // 2) Enable transitions
    const props = (targetOpacity == null) ? 'transform' : 'transform, opacity';
    $el.css({
      transitionProperty: props,
      transitionDuration: duration + 's',
      transitionTimingFunction: easing,
      transitionDelay: delay + 's',
      willChange: 'transform, opacity'
    });

    if (typeof startFn === 'function') startFn($el[0]);

    // 3) Force reflow so the browser captures the CURRENT transform as the start
    void $el[0].offsetWidth;

    // 4) Apply FINAL state (translate + optional scale)
    const transformFinal = this._composeTransform(tx, ty, scaleTarget);
    $el.css('transform', transformFinal);
    if (targetOpacity != null) $el.css('opacity', String(targetOpacity));

    // Fallback guard if transitionend never fires
    const total = (delay + duration) * 1000 + 50;
    const guard = setTimeout(() => {
      if (this._shouldStillPlay($el, startToken)) {
        $el.trigger('transitionend');
      }
    }, total);
    this._setGuardTimer($el, guard);

    // End handler
    const onEnd = (ev) => {
      if (ev && ev.originalEvent && !/^(transform|opacity)$/.test(ev.originalEvent.propertyName)) return;

      clearTimeout(guard);
      $el.off('transitionend.anim', onEnd);

      $el.css({
        transitionProperty: '',
        transitionDuration: '',
        transitionTimingFunction: '',
        transitionDelay: '',
        willChange: ''
      });

      if (targetOpacity === 0) {
        $el.css('visibility', 'hidden');
        this._setHiddenForA11y($el, true);
      }

      const stillValid = this._shouldStillPlay($el, startToken);

      if (typeof endFn === 'function') endFn($el[0]);

      if (stillValid &&
        endSound != null &&
        this.course &&
        typeof this.course.playSound === 'function') {
        try {
          if (beginSound != null &&
            this.course &&
            typeof this.course.stopSound === 'function') {
            this.course.stopSound(beginSound);
          }
        } catch (e) { }
        try { this.course.playSound(endSound); } catch (e) { }
      }

      if (stillValid && chain) {
        this.playAnimation(chain);
      }

      this._cancelAnim($el);
    };

    $el.one('transitionend.anim', onEnd);
  }

  // -------------------------------------------------------------------------
  // Parse data-animation as an array (or single object)
  // -------------------------------------------------------------------------
  parseAnimationJSONList($el) {
    let raw = $el.attr('data-animation');
    if (!raw) return [];

    raw = raw
      .replace(/&quot;/g, '"')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    // Normalize semicolon-separated JSON objects to commas
    if (raw.indexOf(';') !== -1) {
      raw = raw.replace(/;\s*(?=[{\["])/g, ',');
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
      return [];
    } catch (e) {
      console.error('Invalid data-animation JSON after normalization:', raw, e);
      return [];
    }
  }

  // Resolve "Foo.bar.baz" to window.Foo.bar.baz if it’s a function
  _resolveFn(path) {
    if (!path) return null;
    let ctx = window;
    const parts = String(path).split('.');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      ctx = (ctx && ctx[part]) || null;
      if (ctx == null) return null;
    }
    return (typeof ctx === 'function') ? ctx : null;
  }

  // === Typewriter helpers ===================================================

  // Run the typewriter effect. Returns a Promise that resolves when typing finishes.
  _runTypewriter($el, opts) {
    // opts: { duration, delay, cps }
    return new Promise((resolve) => {
      const span = $el.find('.tw-txt').get(0);
      const full = String($el.attr('data-tw-full') || '');
      if (!span || !full.length) {
        if (span) span.textContent = full;
        return resolve();
      }

      if (this.reduceMotion) {
        span.textContent = full;
        return resolve();
      }

      const delayMs = Math.max(0, (opts.delay ?? 0) * 1000);
      const cps = Number(opts.cps);
      const durationMs = (cps && cps > 0)
        ? Math.ceil((full.length / cps) * 1000)
        : Math.max(50, (opts.duration ?? 1) * 1000);

      const stepMs = Math.max(8, Math.floor(durationMs / Math.max(1, full.length)));
      let i = 0;

      const start = () => {
        const tick = () => {
          const end = Math.min(full.length, i + 1);
          span.textContent = full.slice(0, end);
          i = end;

          if (i >= full.length) return resolve();
          typingId = setTimeout(tick, stepMs);
        };
        tick();
      };

      let typingId = null;
      setTimeout(start, delayMs);
    });
  }

  // === Transform helpers ====================================================

  // Compose transform: translate then scale
  _composeTransform(leftPx, topPx, scaleVal) {
    const s = Number.isFinite(scaleVal) ? scaleVal : 1;
    const x = Number.isFinite(leftPx) ? leftPx : 0;
    const y = Number.isFinite(topPx) ? topPx : 0;
    return `translate(${x}px, ${y}px) scale(${s})`;
  }

  // Read current transform (translate + scale)
  _getCurrentTransformParts($el) {
    const el = $el[0];
    if (!el) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };

    const style = window.getComputedStyle(el);
    const t = style.transform || style.webkitTransform || style.mozTransform;
    if (!t || t === 'none') {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    }

    const match = t.match(/matrix(3d)?\((.+)\)/);
    if (!match) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };

    const is3d = !!match[1];
    const vals = match[2].split(',').map(v => parseFloat(v.trim()) || 0);

    if (is3d) {
      return {
        x: vals[12] || 0,
        y: vals[13] || 0,
        scaleX: vals[0] || 1,
        scaleY: vals[5] || 1
      };
    } else {
      return {
        x: vals[4] || 0,
        y: vals[5] || 0,
        scaleX: vals[0] || 1,
        scaleY: vals[3] || 1
      };
    }
  }

  // Map per-axis anchors to a CSS transform-origin string.
  // Accepts data-horizontalAnchor: left|center|right
  // and data-verticleAnchor / data-verticalAnchor: top|center|bottom
  _readAnchor($el) {
    const legacy = String($el.data('anchor') ?? '').toLowerCase().trim();

    let hx = String($el.data('horizontalanchor') ?? '').toLowerCase().trim();
    let vy = String(
      ($el.data('verticleanchor') ?? $el.data('verticalanchor') ?? '')
    ).toLowerCase().trim();

    if (!hx && !vy && legacy) {
      switch (legacy) {
        case 'left-top':
        case 'top-left': return '0% 0%';
        case 'right-top':
        case 'top-right': return '100% 0%';
        case 'left-bottom':
        case 'bottom-left': return '0% 100%';
        case 'right-bottom':
        case 'bottom-right': return '100% 100%';
        case 'center':
        default: return '50% 50%';
      }
    }

    const mapX = { left: '0%', center: '50%', right: '100%' };
    const mapY = { top: '0%', center: '50%', bottom: '100%' };

    const x = mapX[hx] ?? '50%';
    const y = mapY[vy] ?? '50%';

    return `${x} ${y}`;
  }

  // === Animation cancel/guard helpers ======================================

  _markAnimStart($el) {
    const active = ($el.data('_animActive') || 0) + 1;
    $el.data('_animActive', active);
    return active; // token
  }

  _setGuardTimer($el, id) {
    const timers = $el.data('_animGuards') || [];
    timers.push(id);
    $el.data('_animGuards', timers);
  }

  _cancelAnim($el) {
    const timers = $el.data('_animGuards') || [];
    timers.forEach(clearTimeout);
    $el.removeData('_animGuards');

    const active = ($el.data('_animActive') || 0) + 1;
    $el.data('_animActive', active);
  }

  _shouldStillPlay($el, startToken) {
    if (($el.data('_animActive') || 0) !== startToken) return false;
    const el = $el[0];
    if (!el || !el.isConnected || !document.body.contains(el)) return false;
    if (document.visibilityState === 'hidden') return false;
    return true;
  }
}
