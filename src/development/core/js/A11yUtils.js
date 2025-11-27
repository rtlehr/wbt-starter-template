// =========================================
// A11yUtils: focusable selector + hide/show
// =========================================
const A11yUtils = (function () {

  function focusableSelector() {
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

  /**
   * Hide/show an element for assistive tech:
   *  - aria-hidden
   *  - tabindex management on element + descendants
   */
  function setHidden($el, hidden) {
    if (!$el || !$el.length) return;

    if (hidden) {
      // store original tabindex on self (if any)
      if (!$el.data('_prevTabindex')) {
        const prev = $el.attr('tabindex');
        if (prev != null) $el.data('_prevTabindex', prev);
      }
      $el.attr('aria-hidden', 'true').attr('tabindex', '-1');

      // store/disable descendants
      $el.find(focusableSelector()).each(function () {
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
      $el.find(focusableSelector()).each(function () {
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

  return {
    focusableSelector,
    setHidden
  };

})();
