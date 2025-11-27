// Tracks navigation direction: 1 = next, -1 = previous, 0 = none
let nextDirection = 0;   

// Global references to core course objects
let course;
let developmentMenu;
let sound;
let wbtQuiz;

// Define responsive breakpoint queries
const mqPhone   = window.matchMedia('(max-width: 575.98px)');
const mqTablet  = window.matchMedia('(min-width: 768px) and (max-width: 991.98px)');
const mqDesktop = window.matchMedia('(min-width: 992px)');

const mqReduceMotion = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

// Handles changes to screen size breakpoints and notifies the Course object.
function handleBreakpointChange() {

  course.screenSizeChange();

}

// Wire media query listeners (fires whenever match state flips)
[mqPhone, mqTablet, mqDesktop].forEach(mq => {
  mq.addEventListener('change', handleBreakpointChange);
});


// Initializes the course when the DOM is ready: sets up Course, sounds, dev tools, and button handlers.
$(function () {

  // Create and initialize the main Course instance
  course = new Course();
  course.init();

  // Show or hide development tools based on devMode
  if (course.devMode) {
    const developmentMenu = new DevelopmentMenu(course);
    developmentMenu.init();
    $("#dev-tools").css("visibility", "visible");
  } else {
    $("#dev-tools").remove();
  }

  // Previous page button handler
  $('#previousButton').on('click', (e) => {
    e.preventDefault();
    course.gotoPreviousPage();
  });

  // Next page button handler
  $('#nextButton').on('click', (e) => {
    e.preventDefault();
    course.gotoNextPage();
  });

  // Module menu click handler (delegated)
  $('.moduleMenu').on('click', 'li.module', function (e) {
    // Don’t navigate the anchor
    if ($(e.target).closest('a').length) e.preventDefault();

    // Ignore disabled items
    if ($(this).hasClass('notAvailableModule')) return;

    // Index of this <li> among its .module siblings (0-based)
    const $ul = $(this).closest('ul.moduleMenu');
    const index0 = $ul.children('li.module').index(this); // 0-based
    const index1 = index0 + 1;                            // 1-based (unused here but available)

    // Inform the course that a module was clicked
    course.handleModuleClick(index0);
  });

});

class Course {
  
  // Constructs a new Course instance and initializes basic course properties.
  constructor() {
    this.courseContent = null;  // Holds loaded course JSON data
    this.modules = [];          // Holds Module instances

    //Keep track of course location
    this.curMod = 0;
    this.curPage = 0;

    this.nextDirection = 0;

    // Enables/disables development features and tools
    this.devMode = true;

    // Enables/disables credit mode (usage TBD elsewhere in code)
    this.creditMode = false;

  }

  // Asynchronously initializes the course: loads JSON data, creates modules, and initializes navigation and quizzes.
  async init() {

    console.log('Course Initialized');

    // Load course data first (so Navigation can use it immediately)
    const res = await fetch('custom/data/course.json');   // or your JsonLoader

    if (!res.ok) throw new Error('Failed to load course.json');
    this.courseContent = await res.json(); 

    // Load Modules and their pages from the course content
    for (let count = 0; count < this.courseContent.modules.length; count++) {
      this.modules.push(new Module(this, this.courseContent.modules[count]));
    }

    // Set up supporting managers/classes
    this.animation = new Animation(this);

    this.sound = new Sound(this);

    this.addSound("buttonClick", "content/audio/computer-mouse-click.mp3");
    this.addSound("holdMyBeer", "content/audio/hold-my-beerwatch-this.mp3");
    this.addSound("piano", "content/audio/piano_with_horror_me.mp3");
    this.addSound("waitAMinute", "content/audio/wait-a-minute-who-are-you.mp3");
    this.addSound("wow", "content/audio/wow.mp3");
    this.addSound("typewriterkeys", "content/audio/typewriter-keys.mp3");
    this.addSound("typewriterbell", "content/audio/typewriter-bell.mp3");

    this.quizManager = new QuizManager(this, this.courseContent.quizSettings);

    this.interface   = new Interface(this, this.modules);

    this.interactionCheck = new InteractionCheck(this, this.interface);

    this.navigation = new Navigation(this, this.modules, this.interface, this.quizManager, this.interactionCheck);  
    this.navigation.init();

    // Load the initial intro screen
    $('#currentPage').load('content/introScreen.html'); 

  }

  /******************************* */
  //
  // NAVIGATION CONTROL
  //
  /******************************* */

  
  // Handles when a module is clicked in the UI and navigates to its first page in the appropriate direction.
  handleModuleClick(module) {

    let d = 1;

    // If the clicked module is before the current one, reverse direction
    if (module < this.curMod) {
      d = -1;
    }

    this.gotoPage(module, 0, d);
  }

  
  // Navigates to the next page in the course using the Navigation object.
  gotoNextPage() {
    nextDirection = 1;
    this._calcAndLoadNextPage(1);
  }

  
  // Navigates to the previous page in the course using the Navigation object.
  gotoPreviousPage() {
    nextDirection = -1;
    this._calcAndLoadNextPage(-1);
  }

  // NEW helper – moves the old calcNextPage logic into Course
  _calcAndLoadNextPage(direction) {
    let mod = this.curMod;
    let page = this.curPage;

    page += direction;

    const totalPagesInMod = this.modules[mod].getTotalPages();

    if (page > totalPagesInMod - 1) {
      page = 0;
      mod++;
    } else if (page < 0) {
      mod--;
      page = this.modules[mod].getTotalPages() - 1;
    }

    this.gotoPage(mod, page, direction);
  }

  // Navigates directly to a specific module and page, with an optional direction value.
  gotoPage(mod, page, d = 1) {
    // store indices here
    this.curMod = mod;
    this.curPage = page;

    this.navigation.loadPage(mod, page, d);
  }

  /******************************* */
  //
  // ANIMATION CONTROL
  //
  /******************************* */
  
  // Plays an animation on a given element using the Animation object.
  playAnimation(element, index) {
    this.animation.playAnimation(element, index);
  }
  
  /******************************* */
  //
  // SOUND CONTROL
  //
  /******************************* */
  
  addSound(soundName, soundURL) {
    this.sound.add(soundName, soundURL);
  }

  playSound(soundName) {
    this.sound.playsound(soundName);
  }

  stopSound(soundName) {
    this.sound.stop(soundName);
  }

  stopAllSounds() {
    this.sound.stopAll();
  }

  /******************************* */
  //
  // HELPERS
  //
  /******************************* */

  // Returns the total number of modules in the course.
  getTotalMods() {
    return this.modules.length;
  }

  // Handles changes in screen size by adjusting navigation and content visibility.
  screenSizeChange() {

    this.navigation.checkFooterVisibility();

    this.navigation.adjustContentVisibility();

    this.navigation.adjustToolTip();

  }
 
}
