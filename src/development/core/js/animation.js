class Animation {

  constructor(course, pageInfo) {
    this.course = course;

    // ACCESSIBILITY: detect prefers-reduced-motion once
    this.reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    console.log("Animation Initialized")
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
    console.log("setUpAnimation()");

    $(".animateMe").each(function(){
      let eWidth = $(this).width();   
      let eHeight = $(this).height();
      let eTop = $(this).offset().top; 
      let eLeft = $(this).offset().left;

      let wHeight = $("#courseWindow").height();
      let wWidth = $("#courseWindow").width();
      let wTop = $("#courseWindow").offset().top;
      let wLeft = $("#courseWindow").offset().left;

      let newTop = 0;
      let newLeft = 0;

      let goToTop = 0;
      let goToLeft = 0;
      let goToOpacity = 1;

      //slideInBottom
      if($(this).hasClass("slideInBottom")) {
        newTop = (wHeight - (eTop - wTop));
      }
      //slideInRight
      if($(this).hasClass("slideInRight")) {
        newLeft = (wWidth - (eLeft - wLeft));
      }
      //slideInTop
      if($(this).hasClass("slideInTop")) {
        newTop = 0 - ((eTop - wTop) + eHeight);
      }
      //slideInLeft
      if($(this).hasClass("slideInLeft")) {
        newLeft = 0 - ((eLeft - wLeft) + eWidth);
      }

      //slideOutLeft
      if($(this).hasClass("slideOutLeft")) {
        newLeft = 0;
        goToLeft = 0 - ((eLeft - wLeft) + eWidth);
      }
      //slideOutRight
      if($(this).hasClass("slideOutRight")) {
        newLeft = 0;    
        goToLeft = (wWidth - (eLeft - wLeft));
      }
      //slideOutTop
      if($(this).hasClass("slideOutTop")) {
        newTop = 0;
        goToTop = 0 - ((eTop - wTop) + eHeight);
      }
      //slideOutBottom
      if($(this).hasClass("slideOutBottom")) {
        newTop = 0;
        goToTop = (wHeight - (eTop - wTop));
      }

      //fadeIn
      if($(this).hasClass("fadeIn")) {
        $(this).css("opacity", 0);
      }
      //fadeOut
      if($(this).hasClass("fadeOut")) {
        goToOpacity = 0;
      }

      if(newTop != 0) {
        $(this).css("top", newTop);
        if(newTop < 0) { goToTop = Math.abs(newTop); }
        else { goToTop = 0 - newTop; }
      }

      if(newLeft != 0) {
        $(this).css("left", newLeft);
        if(newLeft < 0) { goToLeft = Math.abs(newLeft); }
        else { goToLeft = 0 - newLeft; }
      }

      const cfg = {
        left:     goToLeft,
        top:      goToTop,
        opacity:  goToOpacity,
        duration: $(this).data('duration') ?? 1,
        delay:    $(this).data('delay') ?? 0
      };

      $(this).attr('data-animation', JSON.stringify(cfg));

      // Always last line
      $(this).css("visibility", "visible");
    });
  }

  playAnimation(target) {
    const $el = (typeof target === 'string') ? $(target).first() : $(target);
    if (!$el || !$el.length) return;

    const cfg = this.parseAnimationJSON($el);

    // Defaults
    const left     = Number(cfg.left || 0);
    const top      = Number(cfg.top  || 0);
    const opacity  = (cfg.opacity == null) ? null : Number(cfg.opacity);
    const duration = Number(cfg.duration || 0.6);
    const delay    = Number(cfg.delay    || 0);
    const easing   = cfg.easing || 'ease';

    // Callbacks & chaining
    const startFnName = $el.attr('data-startFunction');
    const endFnName   = $el.attr('data-endFunction');
    const chain       = $el.attr('data-chain') || null;
    const startFn = (startFnName && window[startFnName]) || null;
    const endFn   = (endFnName   && window[endFnName])   || null;

    // ACCESSIBILITY: if we’re going to show (opacity > 0), make it visible and restore focusability
    if (opacity == null || opacity > 0) {
      $el.css('visibility', 'visible');
      this._setHiddenForA11y($el, false);
    }

    // Respect reduce motion: jump to end state, still honor callbacks/chain
    if (this.reduceMotion) {
      if (typeof startFn === 'function') startFn($el[0]);

      // immediate final state
      $el.css({
        transform: `translate(${left}px, ${top}px)`,
        opacity: (opacity != null) ? String(opacity) : $el.css('opacity')
      });

      // A11y when hidden at end
      if (opacity === 0) {
        $el.css('visibility', 'hidden');
        this._setHiddenForA11y($el, true);
      }

      if (typeof endFn === 'function') endFn($el[0]);
      if (chain) this.playAnimation(chain);
      return;
    }

    // Build transition CSS
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
}
