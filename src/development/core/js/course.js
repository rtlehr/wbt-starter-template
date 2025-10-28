let curMod = 0;
let curPage = 0;
let devMode = true;
let course;
let developmentMenu;

// define your queries once
const mqPhone   = window.matchMedia('(max-width: 575.98px)');
const mqTablet  = window.matchMedia('(min-width: 768px) and (max-width: 991.98px)');
const mqDesktop = window.matchMedia('(min-width: 992px)');

// a single function to run whenever the breakpoint might change
function handleBreakpointChange() {

  console.log(`isPhone: ${mqPhone.matches}, isTablet: ${mqTablet.matches}, isDesktop: ${mqDesktop.matches}`);

  course.screenSizeChange();

}

// wire listeners (fires whenever match state flips)
[mqPhone, mqTablet, mqDesktop].forEach(mq => {
  mq.addEventListener('change', handleBreakpointChange);
});

$(function () {

  course = new Course();
  course.init();

  if(devMode)
  {
    developmentMenu = new DevelopmentMenu(course);
    developmentMenu.init();
    $("#dev-tools").css("visibility", "visible");
  }
  else
  {
    $("#dev-tools").remove();
  }

  // Use arrow functions so `this` = outer scope (but we don't need `this` anyway)
  $('#previousButton').on('click', (e) => {
    e.preventDefault();
    console.log('previousButton clicked!');
    course.gotoPreviousPage();      // <- use captured variable
  });

  $('#nextButton').on('click', (e) => {
    e.preventDefault();
    console.log('nextButton clicked!');
    course.gotoNextPage();          // <- use captured variable
  });
});

class Course {
  
  constructor() {
    this.courseContent = null;
    this.modules = [];
  }

  async init() {
    console.log('Course Initialized');

    // Load course data first (so Navigation can use it immediately)
    const res = await fetch('custom/data/course.json');   // or your JsonLoader
    if (!res.ok) throw new Error('Failed to load course.json');
    this.courseContent = await res.json(); 

    //Load Modules and Pages
    for(let count=0; count < this.courseContent.modules.length; count++) {
      
      this.modules.push(new Module(this, this.courseContent.modules[count]));

    }

    this.animation = new Animation();

    // Now safe to init navigation
    this.navigation = new Navigation(this, this.animation, this.modules);
    this.navigation.init();

    this.gotoPage(0, 0);

  }

  gotoNextPage() {
    this.navigation.calcNextPage(1);
  }

  gotoPreviousPage() {
    this.navigation.calcNextPage(-1);
  }

  gotoPage(mod, page) 
  {
    this.navigation.loadPage(mod, page);
  }

  playAnimation(element)
  {
    this.navigation.playAnimation(element);
  }

  getTotalMods()
  {

    return this.modules.length;

  }

  screenSizeChange()
  {

    this.navigation.checkFooterVisibility();

    this.navigation.adjustContentVisibility();

    this.navigation.adjustToolTip();

  }

 
}

