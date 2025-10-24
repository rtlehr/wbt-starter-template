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

