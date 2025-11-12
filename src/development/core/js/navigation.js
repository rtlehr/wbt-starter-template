class Navigation {
  constructor(course, animation, modules, quizManager) {

    this.course  = course;
    this.animation = animation;
    this.modules = modules;
    this.quizManager = quizManager;
    this.pageName = "";
    
    this.lmsManagement = new lmsManagement();  
    
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

    //$(window).on('resize.navigation', () => this._updateMeasurements());

    this._initResizeHandler();

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

      const width = this.animateWidth;
      const offset = -direction * width;

      // position row at 0 with next panel preloaded off-screen
      this.$row.css({ transform: 'translate3d(0,0,0)' });
      $loadDiv.css({ transform: `translate3d(${offset}px,0,0)` });

      // Animate both with CSS classes or inline transition
      const dur = 800;
      this.$row.add($loadDiv).css({
        transition: `transform ${dur}ms ease`
      });

      // Force reflow
      void this.$row[0].offsetWidth;

      // Slide row by width
      this.$row.css({ transform: `translate3d(${offset}px,0,0)` });
      $loadDiv.css({ transform: `translate3d(0,0,0)` });

      setTimeout(() => {
        // cleanup + swap content
        this.$row.add($loadDiv).css({ transition: '', transform: '' });
        this.$currentPage.html($loadDiv.html());
        this._buildPageName(curMod, curPage);
        this.$currentPage.find(".pageContent").attr("id", this.pageName);
        $loadDiv.empty();

        this.interface.setInterface();
        this.interface.setPageNumber(this.modules[curMod].getTotalPages());
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
  const leftStr = this.$row.css('left'); // e.g. "-1200px"
  const left = parseFloat(leftStr) || 0;

  if (left < 0 && this._isPhone()) {
    if (this.contentRowDesktopPos == null) {
      this.contentRowDesktopPos = leftStr;
    }
    this.$row.css('left', '0px');
  }

  if (this._isDesktop() && this.contentRowDesktopPos != null) {
    this.$row.css('left', this.contentRowDesktopPos);
  }
}


   cleanCourse()
  {
    //remove uneeded DIVS
    $(".ui-widget-content").each(function(){   

      if(!$(this).hasClass("modalKeepMe"))
      {
        $(this).remove();
      }

    });

    this.addPageFunctionality();
    
  }

  addPageFunctionality() {

    this.modalWindow.addModal();

    this.toolTip.addToolTip();

    this.animation.setUpAnimation();

    this.checkViewedCount();

    this.checkQuiz();

  }

  checkViewedCount()
  {
    this.interface.checkViewedCount();
  }

  adjustToolTip()
  {
    this.toolTip.adjustForScreenSize();
  }

  playAnimation(element)
  {

    this.animation.playAnimation(element);

  }

  checkQuiz()
  {

    console.log("Has Quiz: " + this.modules[curMod].pages[curPage].isQuiz());

    if(this.modules[curMod].pages[curPage].isQuiz())
    {
      this.quizManager.init(this.modules[curMod].pages[curPage].quizAnswers());
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
