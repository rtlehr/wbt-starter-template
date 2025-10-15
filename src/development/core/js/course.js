let curMod = 0;
let curPage = 0;

$(function () {
  const course = new Course();
  course.init();

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
  constructor() {}

  init() {
    console.log('Course Initialized');
    this.navigation = new Navigation(this);
    this.navigation.init();
  }

  gotoNextPage() {
    this.navigation.calcNextPage(1);   // <- fixed typo
  }

  gotoPreviousPage() {
    this.navigation.calcNextPage(-1);  // <- fixed typo
  }

  gotoPage(mod, page) {}
}

