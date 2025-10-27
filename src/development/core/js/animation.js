class Animation {

  constructor(course, pageInfo) 
  {
    
    this.course = course;

  }

  init() {

    console.log("Animation Initialized")
  
  }

  setUpAnimation()
  {
    console.log("setUpAnimation()");

    let _this = this;



  //return { top: a.top - b.top, left: a.left - b.left };

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
        if($(this).hasClass("slideInBottom"))
        {
            newTop = (wHeight - (eTop - wTop));
        }

        //slideInRight
        if($(this).hasClass("slideInRight"))
        {
            newLeft = (wWidth - (eLeft - wLeft));
        }

        //slideInTop
        if($(this).hasClass("slideInTop"))
        {
            newTop = 0 - ((eTop - wTop) + eHeight);
        }

        //slideInLeft
        if($(this).hasClass("slideInLeft"))
        {
            newLeft = 0 - ((eLeft - wLeft) + eWidth);
        }

        //slideOutLeft
        if($(this).hasClass("slideOutLeft"))
        {
            newLeft = 0;
            goToLeft = 0 - ((eLeft - wLeft) + eWidth);
        }

        //slideOutRight
        if($(this).hasClass("slideOutRight"))
        {
            newLeft = 0;    
            goToLeft = (wWidth - (eLeft - wLeft));
        }
        
        //slideOutTop
        if($(this).hasClass("slideOutTop"))
        {
            newTop = 0;
            goToTop = 0 - ((eTop - wTop) + eHeight);
        }

        //slideOutBottom
        if($(this).hasClass("slideOutBottom"))
        {
            newTop = 0;
            goToTop = (wHeight - (eTop - wTop));
        }

        //fadeIn
        if($(this).hasClass("fadeIn"))
        {
            $(this).css("opacity", 0);
        }

        $(this).css("top", newTop);
        $(this).css("left", newLeft);

        $(this).css("visibility", "visible");

        $(this).attr("data-animation", goToLeft + "|" + goToTop + "|" + goToOpacity);

        //_this.playAnimation($(this).attr("id"));

    });
  }

  playAnimation(element)
  {

    console.log("Animate ID: " + element);

    const $box = $("#" + element);

    let anim = $box.data('animation').split("|");

    let delay = $box.data('delay') || 0;

    let chain = $box.data('animationchain') || null

    // Optional: delay before the animation starts (in the "fx" queue)
    $box
    .delay(delay) // 200ms delay; remove if you don't need it

    // Animate with options object
    .animate(
        // --- properties to animate ---
        { left: anim[0], top: anim[1], opacity: anim[2] },

        // --- options ---
        {
        duration: 1000,         // ms
        easing: 'swing',        // 'swing' | 'linear' (more easings if jQuery UI is loaded)

        // Per-property easing (overrides the main easing for specific props)
        specialEasing: {
            left: 'linear',       // left uses linear easing
            top:  'linear'         // top uses swing
            // With jQuery UI you can use: 'easeInOutQuad', etc.
        },

        queue: 'fx',            // which queue to use; set false to run immediately (no queue)

        // Fires once, when the animation is about to start
        start: function (animation) {
            // console.log('start', animation);
        },

        // Fires for every animation tick (per property value update)
        step: function (now, tween) {
            // now  = current value, tween.prop = 'left' | 'top' | ...
            // e.g., console.log('stepping', tween.prop, now);
        },

        // Fires repeatedly with overall progress across all properties
        progress: function (animation, progress, remainingMs) {
            // progress = 0..1, remainingMs ~ time left
            // e.g., update a progress bar
        },

        // Fires once when this specific animation completes successfully
        complete: () => {
          console.log('Finished moving in (complete)');
          if (chain) {
            this.playAnimation(chain);  // now works
          }
        },

        // jQuery 3 adds these Deferred-style hooks:
        done: function (animation, jumpedToEnd) {
            // called on success; jumpedToEnd === true if .stop(true, true) forced completion
        },
        fail: function (animation, jumpedToEnd) {
            // called if animation was stopped without jumping to end
        },
        always: function (animation, jumpedToEnd) {
            // called whether done or fail (like finally)
        }
        }
    );

  }
}


// jQuery version
function animateMe(target) {
  console.log("---animateMe called:", target);

  var $el = (typeof target === 'string') ? $(target).first() : $(target);
  if (!$el || !$el.length) return;

  var cfg = parseAnimationJSON($el);

  console.log("data-animation:", $el.data('animation'));

  // Options with defaults
  var left     = Number(cfg.left || 0);        // px
  var top      = Number(cfg.top  || 0);        // px
  var opacity  = (cfg.opacity == null) ? null : Number(cfg.opacity);
  var duration = Number(cfg.duration || 0.6);   // seconds
  var delay    = Number(cfg.delay    || 0);     // seconds
  var easing   = cfg.easing || 'ease';

  // Optional callback names on the element
  var startFnName = $el.attr('data-startFunction');
  var endFnName   = $el.attr('data-endFunction');
  var startFn = (startFnName && window[startFnName]) || null;
  var endFn   = (endFnName   && window[endFnName])   || null;

  // Build transition CSS
  var props = (opacity == null) ? 'transform' : 'transform, opacity';
  $el.css({
    transitionProperty: props,
    transitionDuration: duration + 's',
    transitionTimingFunction: easing,
    transitionDelay: delay + 's'
  });

  // Call start just before triggering transition
  if (typeof startFn === 'function') startFn($el[0]);

  // Force reflow so the transition will run
  // (jQuery doesn't have a reflow helper; read offsetWidth)
  void $el[0].offsetWidth;

  // Apply final state
  $el.css('transform', 'translate(' + left + 'px,' + top + 'px)');
  if (opacity != null) $el.css('opacity', String(opacity));

  // End handler: fires once, for transform/opacity only
  var onEnd = function (ev) {
    if (ev && ev.originalEvent && !/^(transform|opacity)$/.test(ev.originalEvent.propertyName)) {
      return; // ignore other transitioned properties
    }
    $el.off('transitionend', onEnd);

    // Optional cleanup of transition inline styles
    $el.css({
      transitionProperty: '',
      transitionDuration: '',
      transitionTimingFunction: '',
      transitionDelay: ''
    });

    if (typeof endFn === 'function') endFn($el[0]);
  };

  // Use .one to auto-remove after first relevant end event
  $el.one('transitionend', onEnd);
}

function parseAnimationJSON($el) {
  // Get raw attribute exactly as the browser sees it
  var raw = $el.attr('data-animation');
  console.log('data-animation (raw):', raw, 'length:', raw ? raw.length : 0);

  if (!raw) return {};

  // Normalize: convert &quot; → " and strip smart quotes
  raw = raw
    .replace(/&quot;/g, '"')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // If someone used semicolons as separators, make them commas
  // (only between value pairs: ; followed by optional space + ")
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


