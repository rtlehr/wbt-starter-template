class Animation {
  constructor(course, pageInfo) {
    this.course = course;

    // Cached selectors we reuse a lot
    this.$win = $('#courseWindow');
  }

  init() {
    console.log('Animation Initialized');
  }

  /**
   * Scan .animateMe elements, compute their initial positions (off-screen or faded),
   * then store the target end-state in data-animation as "left|top|opacity".
   */
  setUpAnimation() {
    console.log('setUpAnimation()');

    const win = this._getWindowMetrics();

    $('.animateMe').each((_, el) => {
      const $el = $(el);

      // Current element metrics relative to the document
      const elm = this._getElementMetrics($el);

      // Starting offsets (where the element should start before animating in)
      const start = this._computeStartOffsets($el, win, elm);

      // Target end-state (where the element should end after animation)
      const target = this._computeTargetOffsets($el, win, elm);

      // Fade presets based on classes (does not change the target; only start)
      this._applyFadePreset($el);

      // Apply starting position and make visible
      this._setInitialStyles($el, start);

      // Persist the target as a simple pipe string: "left|top|opacity"
      this._writeAnimationData($el, target);
    });
  }

  /**
   * Play one element's animation. Will honor optional data attributes:
   *   data-delay, data-duration, data-easing, data-animationchain
   * Uses the data-animation string created in setUpAnimation().
   */
  playAnimation(element) {
    console.log('Animate ID: ' + element);

    const $box = $('#' + element);
    if ($box.length === 0) return;

    // Parse data-animation → { left, top, opacity }
    const anim = this._readAnimationData($box); // { left, top, opacity }

    // Optional per-element overrides
    const delay   = this._toInt($box.data('delay'), 0);
    const duration =
      this._prefersReducedMotion() ? 0 : this._toInt($box.data('duration'), 1000);
    const easing  = ($box.data('easing') || 'swing');            // 'swing' | 'linear' | (jQuery UI easings if loaded)
    const chain   = $box.data('animationchain') || null;

    // Optional: per-property easing can also be provided via data-* if you want later
    const options = {
      duration,
      easing,
      specialEasing: { left: 'linear', top: 'linear' },
      queue: 'fx',
      start: function () {},
      step: function (now, tween) {},
      progress: function (animation, progress, remainingMs) {},
      complete: () => {
        if (chain) {
          this.playAnimation(chain); // continue the chain
        }
      },
      done: function () {},
      fail: function () {},
      always: function () {}
    };

    // Make sure CSS left/top have numeric baselines if you animate those properties
    if ($box.css('left') === 'auto') $box.css('left', 0);
    if ($box.css('top')  === 'auto') $box.css('top',  0);

    // Run
    $box.delay(delay).animate(anim, options);
  }

  /* =========================================================
     Helpers — small, focused utilities (no API changes above)
     ========================================================= */

  // Window (courseWindow) metrics used for slides in/out
  _getWindowMetrics() {
    const $w = this.$win;
    return {
      width:  $w.width(),
      height: $w.height(),
      top:    $w.offset().top,
      left:   $w.offset().left
    };
  }

  // Element metrics used for distance calculations
  _getElementMetrics($el) {
    return {
      width:  $el.outerWidth(),
      height: $el.outerHeight(),
      top:    $el.offset().top,
      left:   $el.offset().left
    };
  }

  /**
   * Determine where the element should start (before animation begins),
   * based on slideIn* classes. Defaults to (0,0).
   */
  _computeStartOffsets($el, win, elm) {
    let startTop = 0;
    let startLeft = 0;

    if ($el.hasClass('slideInBottom')) {
      // Move it below the window by the distance from element to window top
      startTop = (win.height - (elm.top - win.top));
    }
    if ($el.hasClass('slideInRight')) {
      startLeft = (win.width - (elm.left - win.left));
    }
    if ($el.hasClass('slideInTop')) {
      startTop = -((elm.top - win.top) + elm.height);
    }
    if ($el.hasClass('slideInLeft')) {
      startLeft = -((elm.left - win.left) + elm.width);
    }

    return { top: startTop, left: startLeft };
  }

  /**
   * Determine the animation target offsets based on slideOut* classes.
   * Defaults to staying in place (0,0) with opacity 1.
   */
  _computeTargetOffsets($el, win, elm) {
    let goToTop = 0;
    let goToLeft = 0;
    let goToOpacity = 1;

    if ($el.hasClass('slideOutLeft')) {
      goToLeft = -((elm.left - win.left) + elm.width);
    }
    if ($el.hasClass('slideOutRight')) {
      goToLeft = (win.width - (elm.left - win.left));
    }
    if ($el.hasClass('slideOutTop')) {
      goToTop = -((elm.top - win.top) + elm.height);
    }
    if ($el.hasClass('slideOutBottom')) {
      goToTop = (win.height - (elm.top - win.top));
    }

    if ($el.hasClass('fadeOut')) {
      // Start fully visible; end at 0
      $el.css('opacity', 1);
      goToOpacity = 0;
    }

    return { left: goToLeft, top: goToTop, opacity: goToOpacity };
  }

  /**
   * For fadeIn, we set starting opacity to 0.
   * (Your original logic treated fadeOut separately in target computation.)
   */
  _applyFadePreset($el) {
    if ($el.hasClass('fadeIn')) {
      $el.css('opacity', 0);
    }
  }

  // Apply initial styles before animation
  _setInitialStyles($el, start) {
    $el.css({
      top:  start.top,
      left: start.left,
      visibility: 'visible'
    });
  }

  // Persist target into data-animation pipe string (left|top|opacity)
  _writeAnimationData($el, target) {
    const str = [target.left, target.top, target.opacity].join('|');
    $el.attr('data-animation', str);
  }

  // Read data-animation pipe string and return an object compatible with .animate()
  _readAnimationData($el) {
    const raw = String($el.data('animation') || '0|0|1');
    const parts = raw.split('|');

    // Convert numeric-looking values; pass through strings like "+=50"
    const parseVal = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? v : n;
    };

    return {
      left:    parseVal(parts[0]),
      top:     parseVal(parts[1]),
      opacity: parseVal(parts[2])
    };
  }

  _toInt(v, fallback) {
    const n = parseInt(v, 10);
    return isNaN(n) ? fallback : n;
  }

  _prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
