class Animation {

  constructor(course, pageInfo) {
    this.course = course;

    // ACCESSIBILITY: detect prefers-reduced-motion once
    this.reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    console.log("Animation Initialized");
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
      if (prev != null) { $el.attr('tabindex', String(prev)); }
      else { $el.removeAttr('tabindex'); }
      $el.removeData('_prevTabindex');

      // restore descendants
      $el.find(this._focusableSelector()).each(function () {
        const $c = $(this);
        const p = $c.data('_prevTabindex');
        if (p != null) { $c.attr('tabindex', String(p)); }
        else { $c.removeAttr('tabindex'); }
        $c.removeData('_prevTabindex');
      });
    }
  }
  // -------------------------------------------------------------------------

  setUpAnimation() {

    if (mqPhone.matches) {
      return;
    }

    $(".animateMe").each(function () {
      let eWidth = $(this).width();
      let eHeight = $(this).height();
      let eTop = $(this).offset().top;
      let eLeft = $(this).offset().left;

      // console.log("animation Pane: " + $(this).attr("data-animationPane"));

      let cW = $(this).attr("data-animationPane") || "#courseWindow";

      let wHeight = $(cW).height();
      let wWidth = $(cW).width();
      let wTop = $(cW).offset().top;
      let wLeft = $(cW).offset().left;

      let newTop = 0;
      let newLeft = 0;

      let goToTop = 0;
      let goToLeft = 0;
      let goToOpacity = 1;

      //slideInBottom
      if ($(this).hasClass("slideInBottom")) {
        newTop = (wHeight - (eTop - wTop));
      }
      //slideInRight
      if ($(this).hasClass("slideInRight")) {
        newLeft = (wWidth - (eLeft - wLeft));
      }
      //slideInTop
      if ($(this).hasClass("slideInTop")) {
        newTop = 0 - ((eTop - wTop) + eHeight);
      }

      //slideInLeft
      if ($(this).hasClass("slideInLeft")) {
        newLeft = 0 - ((eLeft - wLeft) + eWidth);
      }

      //slideRight
      if ($(this).hasClass("slideRight")) {
        goToLeft = wWidth - eWidth;
      }

      //slideLeft
      if ($(this).hasClass("slideLeft")) {
        goToLeft = 0 - (wWidth - eWidth);
      }

      //slideBottom
      if ($(this).hasClass("slideBottom")) {
        goToTop = wHeight - eHeight;
      }

      //slideTop
      if ($(this).hasClass("slideTop")) {
        goToTop = 0 - (wHeight - eHeight);
      }

      //slideOutLeft
      if ($(this).hasClass("slideOutLeft")) {
        newLeft = 0;
        goToLeft = 0 - ((eLeft - wLeft) + eWidth);
      }
      //slideOutRight
      if ($(this).hasClass("slideOutRight")) {
        newLeft = 0;
        goToLeft = (wWidth - (eLeft - wLeft));
      }
      //slideOutTop
      if ($(this).hasClass("slideOutTop")) {
        newTop = 0;
        goToTop = 0 - ((eTop - wTop) + eHeight);
      }
      //slideOutBottom
      if ($(this).hasClass("slideOutBottom")) {
        newTop = 0;
        goToTop = (wHeight - (eTop - wTop));
      }

      //fadeIn
      if ($(this).hasClass("fadeIn")) {
        $(this).css("opacity", 0);
      }
      //fadeOut
      if ($(this).hasClass("fadeOut")) {
        goToOpacity = 0;
      }

      if (newTop != 0) {
        $(this).css("top", newTop);
        if (newTop < 0) { goToTop = Math.abs(newTop); }
        else { goToTop = 0 - newTop; }
      }

      if (newLeft != 0) {
        $(this).css("left", newLeft);
        if (newLeft < 0) { goToLeft = Math.abs(newLeft); }
        else { goToLeft = 0 - newLeft; }
      }

      const cfg = {
        left: goToLeft,
        top: goToTop,
        opacity: goToOpacity,
        duration: $(this).data('duration') ?? 1,
        delay: $(this).data('delay') ?? 0
      };

      // TYPEWRITER: prep the node (store full text; create visual span)
      if ($(this).hasClass('typewriter')) {
        const full = $(this).text();
        $(this)
          .attr('aria-label', full)
          .attr('aria-live', 'off') // avoid SR spam during typing
          .empty()
          .append('<span class="tw-txt" aria-hidden="true"></span>')
          .attr('data-tw-full', full);
      }

      $(this).attr('data-animation', JSON.stringify(cfg));

      // Always last line
      $(this).css("visibility", "visible");
    });
  }

  playAnimation(target) {

    console.log("Play Animation: " + target);

    if (mqPhone.matches) {
      return;
    }

    const $el = (typeof target === 'string') ? $(target).first() : $(target);
    if (!$el || !$el.length) return;

    const cfg = this.parseAnimationJSON($el);

    // Defaults
    const left = Number(cfg.left || 0);
    const top = Number(cfg.top || 0);
    const opacity = (cfg.opacity == null) ? null : Number(cfg.opacity);
    const duration = Number(cfg.duration || 0.6);
    const delay = Number(cfg.delay || 0);
    const easing = cfg.easing || 'linear';
    const isTypewriter = $el.hasClass('typewriter');

    // Callbacks & chaining
    const startFnName = $el.attr('data-startFunction');
    const endFnName = $el.attr('data-endFunction');
    const chain = $el.attr('data-chain') || null;
    const startFn = (startFnName && window[startFnName]) || null;
    const endFn = (endFnName && window[endFnName]) || null;

    const beginSound = $el.attr('data-beginSound');
    const endSound = $el.attr('data-endSound');

    // ACCESSIBILITY: if we’re going to show (opacity > 0), make it visible and restore focusability
    if (opacity == null || opacity > 0) {
      $el.css('visibility', 'visible');
      this._setHiddenForA11y($el, false);
    }

    if (beginSound != undefined) {
      course.playSound(beginSound);
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

      // immediate final state (no transform timing here)
      if (opacity != null) $el.css('opacity', String(opacity));

      // A11y when hidden at end
      if (opacity === 0) {
        $el.css('visibility', 'hidden');
        this._setHiddenForA11y($el, true);
      }

      if (typeof endFn === 'function') endFn($el[0]);
      if (endSound != undefined) course.playSound(endSound);
      if (chain) this.playAnimation(chain);
      return;
    }

    // ------- TYPEWRITER BRANCH -----------------------------------------
    if (isTypewriter) {
      if (typeof startFn === 'function') startFn($el[0]);

      // Optional opacity tween in parallel (no transform for typewriter)
      if (opacity != null) {
        $el.css({
          transitionProperty: 'opacity',
          transitionDuration: duration + 's',
          transitionTimingFunction: easing,
          transitionDelay: delay + 's',
          willChange: 'opacity'
        });
        // Force reflow then apply target opacity
        void $el[0].offsetWidth;
        $el.css('opacity', String(opacity));
      }

      // Run typing
      this._runTypewriter($el, this._getTypingOptions($el, duration, delay)).then(() => {
        // Cleanup transition styles
        $el.css({
          transitionProperty: '',
          transitionDuration: '',
          transitionTimingFunction: '',
          transitionDelay: '',
          willChange: ''
        });

        if (opacity === 0) {
          $el.css('visibility', 'hidden');
          this._setHiddenForA11y($el, true);
        }

        if (typeof endFn === 'function') endFn($el[0]);
        if (endSound != undefined) course.playSound(endSound);
        if (chain) this.playAnimation(chain);
      });

      return; // IMPORTANT: skip the transform-based flow below
    }
    // -------------------------------------------------------------------

    // Build transition CSS (non-typewriter path)
    const props = (opacity == null) ? 'transform' : 'transform, opacity';
    $el.css({
      transitionProperty: props,
      transitionDuration: duration + 's',
      transitionTimingFunction: easing,
      transitionDelay: delay + 's',
      willChange: 'transform, opacity' // perf hint during animation
    });

    if (typeof startFn === 'function') startFn($el[0]);

    // Force reflow
    void $el[0].offsetWidth;

    // Apply final state
    $el.css('transform', `translate(${left}px, ${top}px)`);
    if (opacity != null) $el.css('opacity', String(opacity));

    // Fallback guard if transitionend never fires
    const total = (delay + duration) * 1000 + 50;
    const guard = setTimeout(() => $el.trigger('transitionend'), total);

    // End handler (namespaced)
    const onEnd = (ev) => {
      if (ev && ev.originalEvent && !/^(transform|opacity)$/.test(ev.originalEvent.propertyName)) return;

      clearTimeout(guard);
      $el.off('transitionend.anim', onEnd);

      // Cleanup transition styles
      $el.css({
        transitionProperty: '',
        transitionDuration: '',
        transitionTimingFunction: '',
        transitionDelay: '',
        willChange: ''
      });

      // A11y when hidden at end
      if (opacity === 0) {
        $el.css('visibility', 'hidden');
        this._setHiddenForA11y($el, true);
      }

      if (typeof endFn === 'function') endFn($el[0]);

      if (endSound != undefined) {
        course.playSound(endSound);
      }

      if (chain) {
        this.playAnimation(chain);
      }
    };

    $el.one('transitionend.anim', onEnd);
  }

  parseAnimationJSON($el) {
    let raw = $el.attr('data-animation');
    if (!raw) return {};

    raw = raw
      .replace(/&quot;/g, '"')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    if (raw.indexOf(';') !== -1) {
      raw = raw.replace(/;\s*(?=")/g, ',');
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Invalid data-animation JSON after normalization:', raw, e);
      return {};
    }
  }

  // Resolve "Foo.bar.baz" to window.Foo.bar.baz if it’s a function
  _resolveFn(path) {
    if (!path) return null;
    let ctx = window;
    for (const part of String(path).split('.')) {
      ctx = (ctx && ctx[part]) || null;
      if (ctx == null) return null;
    }
    return (typeof ctx === 'function') ? ctx : null;
  }

  // === Typewriter helpers ===================================================

  // Run the typewriter effect. Returns a Promise that resolves when typing finishes.
  _runTypewriter($el, opts) {
    // opts: { duration, delay, cps } — cps (chars/sec) optional; overrides duration logic
    return new Promise((resolve) => {
      const span = $el.find('.tw-txt').get(0);
      const full = String($el.attr('data-tw-full') || '');
      if (!span || !full.length) {
        // nothing to type
        if (span) span.textContent = full;
        return resolve();
      }

      // Reduced motion: show full text and exit
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
          // reveal next char
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

  // Compute typing options, allowing optional data-cps to override duration
  _getTypingOptions($el, duration, delay) {
    const cps = Number($el.data('cps'));
    return { duration, delay, cps: Number.isFinite(cps) ? cps : null };
  }

}
