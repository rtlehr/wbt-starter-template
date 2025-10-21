class Navigation {
  constructor(course, modules) {
    this.course  = course;
    this.modules = modules;

    // Dependencies
    this.modalWindow = new modalWindow();
    this.toolTip     = new toolTip();
    this.interface   = new Interface(this.course, this.modules);

    // DOM cache
    this.$row         = $('#wbtContentRow');
    this.$currentPage = $('#currentPage');
    this.$nextPage    = $('#nextPage');
    this.$prevPage    = $('#previousPage');
    this.$footer      = $('#courseFooter');

    // Layout state
    this.animateWidth = 0;
    this.animateLeft  = 0;

    this.contentRowDesktopPos = null; // optional remember-desktop-pos
  }

  /* ---------- Lifecycle ---------- */
  init() {
    console.log('Navigation Initialized');
    this._updateMeasurements();
    $(window).on('resize.navigation', () => this._updateMeasurements());
  }

  /* ---------- Navigation API (same names) ---------- */

  calcNextPage(direction) {
    // Uses global curMod/curPage as in your codebase
    curPage += direction;

    var total = this.modules[curMod].getTotalPages();
    if (curPage > total - 1) {
      curPage = 0;
      curMod++;
    } else if (curPage < 0) {
      curMod--;
      curPage = this.modules[curMod].getTotalPages() - 1;
    }

    this.loadPage(curMod, curPage, direction);
  }

  loadPage(mod, page, direction = 1) {
    var $targetPane = this._paneForDirection(direction);
    var url = this.modules[mod].pages[page].getPageURL();

    // Phone path: load directly into current
    if (this._isPhone()) {
      this._loadInto(this.$currentPage, url, () => {
        this._callPageLoadedHook();
        this.interface.setInterface();
        this.addPageFunctionality();
      });
      return;
    }

    // Desktop/tablet: load off-screen, then animate
    this._loadInto($targetPane, url, () => {
      this._callPageLoadedHook();
      this.animatePage(direction);
    });
  }

  animatePage(direction) {
    this.checkFooterVisibility();

    var newPos   = this.animateLeft + (-direction * this.animateWidth);
    var $loadDiv = this._paneForDirection(direction);
    var origLeft = this.animateLeft;

    this.$row.stop(true).animate({ left: newPos }, 800, () => {
      // swap + reset position
      this.$row.css('left', origLeft);
      this.$currentPage.html($loadDiv.html());
      $loadDiv.empty();

      // update UI/state
      this.interface.setInterface();
      this.interface.setPageNumber(this.modules[curMod].getTotalPages());
      this.addPageFunctionality();

      this._callHookIfExists('finishedMovingIn');
    });
  }

  checkFooterVisibility() {
    // Show footer on desktop if currently at top:0
    if (this.$footer.css('top') === '0px' && this._isDesktop()) {
      this.interface.showFooter();
    }
    // On phone, ensure it’s visible
    if (this.$footer.css('top') === '-50px' && this._isPhone()) {
      this.$footer.css('top', '0px');
    }
  }

  adjustContentVisibility() {
    console.log('adjustContentVisibility() called');

    var leftStr = this.$row.css('left'); // e.g. "-1200px"

    if (leftStr < '0px' && this._isPhone()) {
      if (this.contentRowDesktopPos == null) {
        this.contentRowDesktopPos = leftStr;
      }
      this.$row.css('left', '0px');
    }

    if (this._isDesktop() && this.contentRowDesktopPos != null) {
      this.$row.css('left', this.contentRowDesktopPos);
    }
  }

  addPageFunctionality() {
    console.log('addPageFunctionality() called');
    this.modalWindow.addModal();
    this.toolTip.addToolTip();
  }

  adjustToolTip()
  {
    this.toolTip.adjustForScreenSize();
  }

  /* ---------- Helpers ---------- */

  _isPhone() {
    if (typeof mqPhone !== 'undefined') return mqPhone.matches;
    return window.matchMedia('(max-width: 575.98px)').matches;
  }

  _isDesktop() {
    if (typeof mqDesktop !== 'undefined') return mqDesktop.matches;
    return window.matchMedia('(min-width: 992px)').matches;
  }

  _paneForDirection(direction) {
    return direction > 0 ? this.$nextPage : this.$prevPage;
  }

  _loadInto($target, url, onSuccess) {
    $target.load(url, (response, status, xhr) => {
      if (status === 'error') {
        $target.html('<p role="alert">Sorry, failed to load this page.</p>');
        console.error('Load error:', xhr.status, xhr.statusText);
        return;
      }
      if (typeof onSuccess === 'function') onSuccess();
    });
  }

  _updateMeasurements() {
    this.animateWidth = this.$currentPage.outerWidth();
    this.animateLeft  = parseFloat(this.$row.css('left')) || 0;
  }

  _callPageLoadedHook() {
    this._callHookIfExists('pageLoadedFunction');
  }

  _callHookIfExists(fnName) {
    var fn = (typeof window !== 'undefined') ? window[fnName] : undefined;
    if (typeof fn === 'function') {
      try { fn(); }
      catch (e) { console.error('Error in ' + fnName + '()', e); }
    }
  }

  destroy() {
    $(window).off('resize.navigation');
  }
}
