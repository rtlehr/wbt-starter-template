let curMod = 0;
let curPage = 0;
let devMode = true;
let creditMode = false;
let nextDirection = 0;

let course;
let developmentMenu;
let sound;
let wbtQuiz;

// define your queries once
const mqPhone   = window.matchMedia('(max-width: 575.98px)');
const mqTablet  = window.matchMedia('(min-width: 768px) and (max-width: 991.98px)');
const mqDesktop = window.matchMedia('(min-width: 992px)');

// a single function to run whenever the breakpoint might change
function handleBreakpointChange() {

  course.screenSizeChange();

}

// wire listeners (fires whenever match state flips)
[mqPhone, mqTablet, mqDesktop].forEach(mq => {
  mq.addEventListener('change', handleBreakpointChange);
});

$(function () {

  course = new Course();
  course.init();

  sound = new Sound(course);

  course.addSound("buttonClick", "content/audio/computer-mouse-click.mp3");
  course.addSound("holdMyBeer", "content/audio/hold-my-beerwatch-this.mp3");
  course.addSound("piano", "content/audio/piano_with_horror_me.mp3");
  course.addSound("waitAMinute", "content/audio/wait-a-minute-who-are-you.mp3");
  course.addSound("wow", "content/audio/wow.mp3");
  course.addSound("typewriterkeys", "content/audio/typewriter-keys.mp3");
  course.addSound("typewriterbell", "content/audio/typewriter-bell.mp3");

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
    course.playSound("buttonClick");
    course.gotoPreviousPage();      // <- use captured variable
  });

  $('#nextButton').on('click', (e) => {
    e.preventDefault();
    course.playSound("buttonClick");
    course.gotoNextPage();          // <- use captured variable
  });

  $('.moduleMenu').on('click', 'li.module', function (e) {
    // Don’t navigate the anchor
    if ($(e.target).closest('a').length) e.preventDefault();

    // Ignore disabled items
    if ($(this).hasClass('notAvailableModule')) return;

    // Index of this <li> among its .module siblings (0-based)
    const $ul = $(this).closest('ul.moduleMenu');
    const index0 = $ul.children('li.module').index(this); // 0-based
    const index1 = index0 + 1;                            // 1-based (if you prefer)

    course.handleModuleClick(index0); // <-- your function
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

    this.quizManager = new QuizManager(this, this.courseContent.quizSettings);

    this.navigation = new Navigation(this, this.animation, this.modules, this.quizManager);  
    this.navigation.init();

    $('#currentPage').load('content/introScreen.html'); 

  }

  handleModuleClick(module) {

    let d = 1;

    if(module < curMod)
    {
      d = -1;
    }

    this.gotoPage(module, 0, d);
    // do stuff...
  }

  gotoNextPage() {
    nextDirection = 1;
    this.navigation.calcNextPage(1);
  }

  gotoPreviousPage() {
    nextDirection = -1;
    this.navigation.calcNextPage(-1);
  }

  gotoPage(mod, page, d = 1) 
  {
    this.navigation.loadPage(mod, page, d);
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

  addSound(soundName, soundURL)
  {

    sound.add(soundName, soundURL);

  }

  playSound(soundName)
  {

    sound.playsound(soundName);

  }

  stopSound(soundName)
  {

    sound.stop(soundName);

  }

  stopAllSounds()
  {
  
    sound.stopAll();
  
  }

  checkViewedCount()
  {
    this.navigation.checkViewedCount();
  }
 
}

