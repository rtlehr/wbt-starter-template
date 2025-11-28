class Navigation {
  constructor(course, modules, int, quizManager, interactionCheck) {

    this.course  = course;
    this.modules = modules;
    this.quizManager = quizManager;
    this.interactionCheck = interactionCheck;
    this.pageName = "";
    
    this.lmsManagement = new lmsManagement(this.course);  
    
    // Dependencies
    this.modalWindow = new modalWindow();
    this.toolTip = new toolTip(this.interactionCheck);
    this.interface = int;

    // DOM cache
    this.$row         = $('#wbtContentRow');
    this.$currentPage = $('#currentPage');
    this.$nextPage    = $('#nextPage');
    this.$prevPage    = $('#previousPage');
    this.$footer      = $('#courseFooter');

    // Layout state
    this.animateWidth = 0;
    this.animateLeft  = 0;

  }

  /* ---------- Lifecycle ---------- */
  init() {
    console.log('Navigation Initialized');

    this._updateMeasurements();

    //$(window).on('resize.navigation', () => this._updateMeasurements());

    this._initResizeHandler();

  }

  loadPage(mod, page, direction = 1) {

    this.course.stopAllSounds();

    var $targetPane = this._paneForDirection(direction);
    var url = this.modules[mod].pages[page].getPageURL();

    // Phone path: load directly into current
    if (this._isPhone()) {
      this._loadInto(this.$currentPage, url, () => {
        this._callPageLoadedHook();
        this.interface.setInterface();
        this.cleanCourse();
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
    const $loadDiv = this._paneForDirection(direction);

    // If user prefers reduced motion: DON'T slide, just swap instantly
    if (MotionPrefs.isReduced()) {

      const modIndex  = this.course.curMod;
      const pageIndex = this.course.curPage;

      this.$currentPage.html($loadDiv.html());
      this._buildPageName(modIndex, pageIndex);
      this.$currentPage.find(".pageContent").attr("id", this.pageName);
      $loadDiv.empty();

      this.interface.setInterface();
      this.interface.setPageNumber(this.modules[modIndex].getTotalPages());
      this.cleanCourse();
      this._callHookIfExists('finishedMovingInCourseFunction');
      this._callHookIfExists('finishedMovingIn');

      return; // IMPORTANT: skip animated path below
    }

  // Normal animated path
  const width = this.animateWidth;
  const offset = -direction * width;

  this.$row.css({ transform: 'translate3d(0,0,0)' });
  $loadDiv.css({ transform: `translate3d(${offset}px,0,0)` });

  const dur = 800;
  this.$row.add($loadDiv).css({
    transition: `transform ${dur}ms ease`
  });

  void this.$row[0].offsetWidth;

  this.$row.css({ transform: `translate3d(${offset}px,0,0)` });
  $loadDiv.css({ transform: `translate3d(0,0,0)` });

  setTimeout(() => {
    this.$row.add($loadDiv).css({ transition: '', transform: '' });
    const modIndex  = this.course.curMod;
    const pageIndex = this.course.curPage;

    this.$currentPage.html($loadDiv.html());
    this._buildPageName(modIndex, pageIndex);
    this.$currentPage.find(".pageContent").attr("id", this.pageName);
    $loadDiv.empty();

    this.interface.setInterface();
    this.interface.setPageNumber(this.modules[modIndex].getTotalPages());
    this.cleanCourse();
    this._callHookIfExists('finishedMovingInCourseFunction');
    this._callHookIfExists('finishedMovingIn');
  }, dur);
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

    // On phones, make sure the row is anchored left = 0
    if (this._isPhone()) {
      this.$row.css('left', '0px');
      return;
    }

    // On desktop/tablet, we don't rely on 'left' anymore
    // because page transitions use transforms.
    // This function is kept for potential future tweaks.
  }



   cleanCourse()
  {
    //remove uneeded DIVS
   /* $(".ui-widget-content").each(function(){   

      if(!$(this).hasClass("modalKeepMe"))
      {
        $(this).remove();
      }

    });*/

    this.addPageFunctionality();
    
  }

  addPageFunctionality() {

    this.modalWindow.addModal();

    this.toolTip.addToolTip();

    this.course.animation.initAnimations();

    this.interactionCheck.checkForNotViewed();

    this.checkQuiz();

  }

  adjustToolTip()
  {
    this.toolTip.adjustForScreenSize();
  }

  checkQuiz()
  {

    const modIndex = this.course.curMod;
    const pageIndex = this.course.curPage;

    if (this.modules[modIndex].pages[pageIndex].isQuiz()) {
      this.quizManager.init(this.modules[modIndex].pages[pageIndex].quizAnswers());
    }

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
    this._callHookIfExists('pageLoadedCourseFunction');
    this._callHookIfExists('pageLoadedFunction');
  }

  _callHookIfExists(fnName) {
    var fn = (typeof window !== 'undefined') ? window[fnName] : undefined;
    if (typeof fn === 'function') {
      try { fn(); }
      catch (e) { console.error('Error in ' + fnName + '()', e); }
    }
  }

  _buildPageName(mod, page)
  {

    this.pageName = this.modules[mod].getId() + "-" + this.modules[mod].pages[page].getId();

  }

  _initResizeHandler() {
  let rafId = 0;
  const onResize = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      this._updateMeasurements();
    });
  };
  $(window).on('resize.navigation', onResize);
}

  destroy() {
    $(window).off('resize.navigation');
  }
}
