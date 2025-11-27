// =========================================
// MotionPrefs: single source of truth
// for prefers-reduced-motion
// =========================================
const MotionPrefs = (function () {

  let reduce = false;
  let mq = null;

  if (window.matchMedia) {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduce = mq.matches;

    mq.addEventListener('change', (e) => {
      reduce = !!e.matches;
      // Broadcast a jQuery event if anything wants to listen
      $(document).trigger('motion:change', [reduce]);
    });
  }

  return {
    isReduced() {
      return !!reduce;
    }
  };

})();
