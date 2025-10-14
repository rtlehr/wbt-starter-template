$(function () {
  $(".skip-link").on("click", function (e) {
    const targetSelector = $(this).attr("href");
    const $target = $(targetSelector);

    if ($target.length) {
      // Let the browser jump first, then move focus
      setTimeout(function () {
        // Ensure it's focusable
        if (!$target.is(":focusable")) {
          $target.attr("tabindex", "-1");
        }
        $target.focus();
      }, 0);
    }
  });
});

// Small jQuery :focusable helper (if you don't already have one)
jQuery.extend(jQuery.expr[":"], {
  focusable: function (el) {
    const $el = $(el);
    const nodeName = el.nodeName.toLowerCase();
    const isFocusableTag = /input|select|textarea|button|object|a/.test(nodeName);
    const hasHref = !!$el.attr("href");
    const hasTabindex = !isNaN($el.attr("tabindex"));
    const isVisible = $el.is(":visible");
    return isVisible && (isFocusableTag ? (nodeName !== "a" || hasHref) : hasTabindex);
  }
});
