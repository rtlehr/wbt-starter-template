class Parallax {

  constructor(opts = {}) {

    this.opts = $.extend(true, { parent: null }, opts);

    this.wHeight = $(this.opts.parent).height();
    this.wWidth  = $(this.opts.parent).width();

    // Respect reduced motion
    if (MotionPrefs.isReduced()) {
      // Optionally: ensure elements are in their "resting" position
      return;
    }

    this.setAnimation();
  }

  init() {}

  setAnimation() {

  //const durMs = Math.max(0, (this.opts.duration || 0.4) * 1000);

  const imageWidths = Array.isArray(this.opts.imageWidths) ? this.opts.imageWidths : null;

  const $targets = $(this.opts.parent)
    .find('*')
    .not('.parallaxExclude, .parallaxExclude *');

  const self = this;

  $targets.each(function (i, el) {
    const $el = $(el);

    let durMs = Math.max(0, ((self.opts.duration || 0.4) * 1000));

    // Width to use: provided imageWidths[i] → else rendered width → else DOM rect
    let widthForThis =
      (imageWidths && imageWidths[i] != null) ? Number(imageWidths[i]) : $el.outerWidth();

    if (!widthForThis || widthForThis === 0) {
      widthForThis = el.getBoundingClientRect().width || 0;
    }

    // Movement rule: slide left by the layer's width (or your custom math)
    // If you want: const moveLeft = -widthForThis;
    const eLeft = $el.position() ? ($el.position().left || 0) : 0;

    const moveLeft = ((eLeft + self.wWidth) - widthForThis) * self.opts.distance[i];

    // Set transition
    $el.css({
      transition: 'transform ' + durMs + 'ms linear',
      willChange: 'transform'
    });

    // Force reflow so the browser applies the transition
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;

    // Animate
    $el
      .css('transform', 'translateX(' + moveLeft + 'px)')
      .one('transitionend', function () {
        // Optional cleanup
        $(this).css({ transition: '', willChange: '' });
      });
  });
}


}



